import { test, expect } from "@playwright/test";
import { randomBytes, randomUUID } from "node:crypto";
import { Buffer } from "node:buffer";

test.setTimeout(90_000);
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWPYE6H8HwAFQgI3AM0NygAAAABJRU5ErkJggg==", "base64");
const fixture = "/e2e/fixtures/cart-ui.html";
const state = async (page) => JSON.parse(await page.getByTestId("draft-state").textContent());
const setup = async (context) => {
  const access = { id: randomUUID(), token: randomBytes(32).toString("hex"), expiresAt: "2030-02-01T00:00:00.000Z" };
  const items = [];
  const keys = [];
  const orders = new Map();
  let revision = 0;
  let checkout = null;
  let invoiceCount = 0;
  let checkoutCount = 0;
  let loseCheckoutResponse = false;
  let deliveryPrice = 450;
  let loseResponse = false;
  let rejectQuantity = false;
  const snapshot = () => ({ id: access.id, expiresAt: access.expiresAt, items, revision, checkout,
    merchandisePrice: items.some((item) => item.linePrice == null) ? null : items.reduce((sum, item) => sum + item.linePrice, 0) });
  const quote = (input) => {
    const merchandisePrice = snapshot().merchandisePrice;
    const certificateDiscount = input.certificateCode ? Math.min(20000, merchandisePrice) : 0;
    const amountDue = merchandisePrice + deliveryPrice - certificateDiscount;
    return { revision, currency: "RUB", isCartOrder: true, manual: false, quoteHash: "a".repeat(64), merchandisePrice, deliveryPrice,
      totalPrice: merchandisePrice + deliveryPrice, certificateDiscount, amountDue, requiresBankPayment: amountDue > 0,
      paymentAmount: amountDue > 0 ? 1 : 0, paymentTestMode: true,
      certificate: input.certificateCode ? { remaining: 20000 - certificateDiscount } : null };
  };
  const mount = async (target) => {
    await target.route("**/api/public-config", (route) => route.fulfill({ json: { turnstile: { enabled: false } } }));
    await target.route("**/api/payments/paykeeper/link", async (route) => {
      const order = orders.get(route.request().postDataJSON().orderId);
      if (!order.invoiceCreated) { invoiceCount += 1; order.invoiceCreated = true; }
      return route.fulfill({ json: { pay_url: "https://paykeeper.fixture.test/pay" } });
    });
    await target.route("https://paykeeper.fixture.test/**", (route) => route.fulfill({ contentType: "text/html; charset=utf-8", body: '<!doctype html><meta charset="utf-8"><h1>PayKeeper test checkout</h1>' }));
    await target.route("**/api/orders/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      const order = orders.get(Number(/\/orders\/(\d+)/.exec(path)?.[1]));
      if (path.endsWith("/complete-certificate")) {
        order.paymentStatus = "paid"; order.status = "Оплачено"; order.paymentProvider = "certificate";
        items.splice(0); checkout = null; revision += 1;
        return route.fulfill({ json: { ok: true } });
      }
      return route.fulfill({ json: order || {} });
    });
    await target.route("**/e2e/catalog-hoodie.png", (route) => route.fulfill({ contentType: "image/png", body: png }));
    await target.route("**/api/cart/**", async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const reply = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
      if (path.endsWith("/session")) return reply(access, 201);
      if (request.headers()["x-cart-access-token"] !== access.token) return reply({ code: "cart_access_required", message: "Нет доступа" }, 401);
      if (path.endsWith("/quote")) {
        if (items.some((item) => item.linePrice == null)) return reply({ message: "Изделие больше недоступно в каталоге", code: "cart_stock_unavailable" }, 409);
        return reply(quote(request.postDataJSON()));
      }
      if (path.endsWith("/checkout/cancel")) {
        if (checkout) { checkout.paymentStatus = "cancelled"; checkout.status = "Отменен"; checkout = null; revision += 1; }
        return reply(snapshot());
      }
      if (path.endsWith("/checkout")) {
        const input = request.postDataJSON();
        if (!checkout) {
          checkoutCount += 1;
          const orderId = 500 + checkoutCount;
          const buyer = { ...input.buyer, phone: "+79991234567", recipientPhone: input.buyer.recipientPhoneDigits ? `+${input.buyer.recipientPhoneDigits}` : "+79991234567",
            recipientFullName: input.buyer.recipientFullName || `${input.buyer.lastName} ${input.buyer.firstName} ${input.buyer.middleName}`.trim() };
          checkout = { ...quote(input), orderId, id: orderId, orderToken: `fixture-order-access-${orderId}`, buyer,
            paymentStatus: "pending", status: "Ожидание оплаты", pricePending: false, officeCode: input.officeCode,
            deliveryAddress: "СДЭК, KRS1, Мира 1", items: items.map((item) => ({ ...item, sourceCartItemId: item.id })) };
          orders.set(orderId, checkout);
        }
        if (loseCheckoutResponse) { loseCheckoutResponse = false; return route.abort(); }
        return reply(checkout);
      }
      if (request.method() === "POST") {
        const key = request.headers()["idempotency-key"];
        keys.push(key);
        let item = items.find((entry) => entry.requestKey === key);
        if (!item) {
          item = { id: randomUUID(), requestKey: key, productType: "Худи", color: "Чёрный", size: "M", imageUrl: "/e2e/catalog-hoodie.png",
            embroideryType: "Patronus", patronusCount: 4, petFaceCount: 1, quantity: 1, unitPrice: 9000, linePrice: 9000, attachments: [],
            parcel: { width: 35, height: 35, length: 7, weight: 800 } };
          items.push(item);
          revision += 1;
        }
        if (loseResponse) { loseResponse = false; return route.abort(); }
        return reply({ ...snapshot(), addedItemId: item.id });
      }
      if (request.method() === "PATCH") {
        if (rejectQuantity) return reply({ message: "Для выбранного количества недостаточно изделий на складе", code: "cart_stock_unavailable" }, 409);
        const item = items.find((entry) => path.endsWith(entry.id));
        item.quantity = request.postDataJSON().quantity;
        item.linePrice = item.unitPrice * item.quantity;
        revision += 1;
      }
      if (request.method() === "DELETE") { items.splice(items.findIndex((entry) => path.endsWith(entry.id)), 1); revision += 1; }
      return reply(snapshot());
    });
  };
  await mount(context);
  return { access, items, keys, mount, orders,
    checkouts: () => checkoutCount, invoices: () => invoiceCount,
    freeDelivery: () => { deliveryPrice = 0; }, loseNextCheckout: () => { loseCheckoutResponse = true; },
    pay: () => { if (checkout) { checkout.paymentStatus = "paid"; checkout.status = "Оплачено"; checkout.paymentProvider = "paykeeper"; }
      items.splice(0); checkout = null; revision += 1; },
    loseNextResponse: () => { loseResponse = true; }, rejectIncrease: () => { rejectQuantity = true; } };
};
const seed = async (page) => {
  await page.getByLabel("Фото для теста").setInputFiles({ name: "pet.png", mimeType: "image/png", buffer: png });
  await page.getByRole("button", { name: "Подготовить худи" }).click();
  await expect(page.getByRole("heading", { name: "Введите свои данные" })).toBeVisible();
};
const add = (page) => page.getByRole("button", { name: "Добавить в корзину", exact: true });
const constructorKey = "its_constructor_draft_v1";
const constructorRecord = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), constructorKey);
const selectGarment = async (page) => {
  await page.locator('.selectorType__item:has(input[value="Hoodie"])').click();
  await page.getByRole("button", { name: "White", exact: true }).click();
  await page.locator('.sizeSelector__item:has(input[value="M"]) .sizeSelector__box').click();
  await expect(page.locator('.orderNavigation .orderActionButton--next')).toBeEnabled();
  await expect.poll(async () => (await constructorRecord(page))?.draft?.clothing).toEqual({ type: "Hoodie", color: "White", size: "M" });
};

test("save current item, retain buyer/delivery, reset only the constructor and restore basket after browser restart", async ({ page, context, browser }) => {
  const server = await setup(context);
  await page.goto(fixture);
  await seed(page);
  await expect(add(page)).toBeDisabled();
  await page.getByPlaceholder("E-mail", { exact: true }).fill("buyer@example.com");
  await page.locator(".recipientOrderForm__consent input").check();
  await expect(add(page)).toBeEnabled();
  await add(page).click();
  await expect(page.getByRole("link", { name: /Открыть корзину/ })).toBeVisible();
  const draft = await state(page);
  expect(draft.embroideryType).toBe("");
  expect(draft.files).toEqual([]);
  expect(draft.recipient.email).toBe("buyer@example.com");
  expect(draft.recipient.privacyConsent).toBe(true);
  expect(draft.recipient.pickupPoint).toContain("Krasnoyarsk");
  expect(server.items).toHaveLength(1);
  await page.getByRole("link", { name: /Открыть корзину/ }).click();
  await expect(page.getByRole("list", { name: "Изделия в корзине" })).toContainText("Патронус × 4");
  await expect(page.locator(".recipientOrderNavigation__submit")).toBeEnabled();
  const persisted = await context.storageState();
  const reopened = await browser.newContext({ storageState: persisted });
  try {
    await server.mount(reopened);
    const restored = await reopened.newPage();
    await restored.goto(fixture);
    await expect(restored.getByRole("list", { name: "Изделия в корзине" })).toContainText("Худи");
    expect((await state(restored)).files).toEqual([]);
    await expect(restored.locator(".recipientOrderNavigation__submit")).toBeDisabled();
  } finally { await reopened.close(); }
});

test("quantity and delete use real cart rows; keyboard works and black dots never select payment items", async ({ page, context }, testInfo) => {
  const server = await setup(context);
  await page.goto(fixture);
  await seed(page);
  await page.locator(".recipientOrderForm__consent input").check();
  await add(page).click();
  await page.getByRole("link", { name: /Открыть корзину/ }).click();
  const increase = page.getByRole("button", { name: "Увеличить количество: Худи" });
  await increase.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".recipientCart__quantity")).toContainText("2 шт");
  await expect(page.locator(".recipientCart__total")).toContainText("18 000");
  expect(await page.locator('.recipientCart input, .recipientCart [role="radio"]').count()).toBe(0);
  const widths = testInfo.project.name.startsWith("desktop") ? [1280, 1920] : [320, 390, 640, 1024];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(100);
    const card = await page.locator(".recipientCart").boundingBox();
    const form = await page.locator(".recipientOrderForm").boundingBox();
    expect(card.x).toBeGreaterThanOrEqual(0);
    expect(card.x + card.width).toBeLessThanOrEqual(width + 1);
    const overlaps = card.x < form.x + form.width && card.x + card.width > form.x && card.y < form.y + form.height && card.y + card.height > form.y;
    expect(overlaps).toBe(false);
    const img = await page.locator(".recipientCart__image").boundingBox();
    expect(Math.abs(img.width - img.height)).toBeLessThan(2);
    await page.screenshot({ path: testInfo.outputPath(`cart-${width}.png`), fullPage: true });
  }
  await page.getByRole("button", { name: "Уменьшить количество: Худи" }).click();
  await expect(page.locator(".recipientCart__quantity")).toContainText("1 шт");
  await expect(page.getByRole("button", { name: "Уменьшить количество: Худи" })).toBeDisabled();
  await page.getByRole("button", { name: /^Удалить изделие/ }).click();
  await expect(page.getByText("В корзине пока нет изделий.")).toBeVisible();
  expect(server.items).toHaveLength(0);
});

test("lost save response keeps files and key; retry cannot duplicate or lose a garment", async ({ page, context }) => {
  const server = await setup(context);
  await page.goto(fixture);
  await seed(page);
  await page.locator(".recipientOrderForm__consent input").check();
  const key = (await state(page)).cartItemKey;
  server.loseNextResponse();
  await add(page).click();
  await expect(page.getByRole("alert")).toContainText("недоступна");
  expect((await state(page)).files).toEqual(["pet.png"]);
  expect((await state(page)).cartItemKey).toBe(key);
  await add(page).click();
  await expect(page.getByRole("link", { name: /Открыть корзину/ })).toBeVisible();
  expect(server.keys).toEqual([key, key]);
  expect(server.items).toHaveLength(1);
});

test("server rejection leaves previous quantity visible; unpriced lines and failed loading cannot enable payment", async ({ page, context }) => {
  const server = await setup(context);
  server.items.push({ id: randomUUID(), requestKey: randomUUID(), productType: "Нет в каталоге", color: "Белый", size: "S",
    imageUrl: "/e2e/catalog-hoodie.png", embroideryType: "Car", quantity: 1, linePrice: null, unitPrice: null, pricingError: "Изделие больше недоступно в каталоге" });
  await context.addInitScript((access) => localStorage.setItem("its_cart_access_v1", JSON.stringify({ version: 1, ...access })), server.access);
  await page.goto(fixture);
  await expect(page.locator(".recipientCart")).toContainText("Изделие больше недоступно в каталоге");
  server.rejectIncrease();
  await page.getByRole("button", { name: /^Увеличить количество/ }).click();
  await expect(page.getByRole("alert")).toContainText("недостаточно изделий");
  await expect(page.locator(".recipientCart__quantity")).toContainText("1 шт");
  await expect(page.locator(".recipientOrderNavigation__submit")).toBeDisabled();
});

test("reload reconciles an accepted upload without asking for the lost File again", async ({ page, context }) => {
  const server = await setup(context);
  await page.goto(`${fixture}?resume=1`);
  await seed(page);
  await page.locator(".recipientOrderForm__consent input").check();
  server.loseNextResponse();
  await add(page).click();
  await expect(page.getByRole("alert")).toContainText("недоступна");
  page.on("dialog", (dialog) => dialog.accept());
  await page.reload();
  await expect(page.getByRole("link", { name: /Открыть корзину/ })).toBeVisible();
  expect((await state(page)).files).toEqual([]);
  expect((await state(page)).embroideryType).toBe("");
  expect(server.items).toHaveLength(1);
  expect(server.keys).toHaveLength(1);
});

const savedBasket = async (page) => {
  await page.goto(fixture); await seed(page);
  await page.locator(".recipientOrderForm__consent input").check();
  await add(page).click();
  await page.getByRole("link", { name: /Открыть корзину/ }).click();
  await expect(page.getByText(/Все изделия и вышивка:/)).toBeVisible();
};

test("two garments share one checkout and one invoice; payment resumes and clears only the paid basket", async ({ page, context }) => {
  const server = await setup(context);
  await savedBasket(page);
  await page.getByRole("button", { name: "Подготовить худи" }).click();
  await expect(page.getByText("Текущее изделие — ещё не в корзине")).toBeVisible();
  await page.getByRole("button", { name: "подтвердить состав" }).click();
  await expect(page.getByRole("list", { name: "Изделия в корзине" }).locator("li")).toHaveCount(2);
  await expect(page.getByText(/Все изделия и вышивка:/)).toContainText("18 000");
  await expect(page.getByRole("radio", { name: "Почта России" })).toBeDisabled();
  await expect(page.getByRole("radio", { name: "Самовывоз" })).toBeDisabled();
  await page.getByRole("button", { name: /^Выбран пункт получения:/ }).click();
  await expect(page.getByRole("dialog", { name: "Выбор пункта СДЭК" })).toBeVisible();
  await expect(page.getByText("В моём городе нет СДЭКа", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Select demo pickup point" }).click();
  await page.locator(".recipientOrderNavigation__submit").click();
  await expect(page.getByRole("heading", { name: "PayKeeper test checkout" })).toBeVisible();
  expect(server.checkouts()).toBe(1); expect(server.invoices()).toBe(1);
  expect([...server.orders.values()][0].items).toHaveLength(2);
  await page.goto(fixture);
  await expect(page.getByRole("button", { name: "Отменить оформление и изменить корзину" })).toBeVisible();
  for (const button of await page.locator(".recipientCart__quantity button").all()) await expect(button).toBeDisabled();
  await page.locator(".recipientOrderNavigation__submit").click();
  await expect(page.getByRole("heading", { name: "PayKeeper test checkout" })).toBeVisible();
  expect(server.checkouts()).toBe(1); expect(server.invoices()).toBe(1);
  server.pay();
  await page.goto(fixture);
  await page.getByRole("button", { name: "Вернуться с оплаты" }).click();
  await expect(page.getByRole("heading", { name: "спасибо за заказ", exact: true })).toBeVisible();
  expect(server.items).toHaveLength(0);
  expect((await state(page)).files).toEqual([]);
});

test("a lost checkout response recovers its order and allows safe cancellation without deleting garments", async ({ page, context }) => {
  const server = await setup(context);
  await savedBasket(page);
  server.loseNextCheckout();
  await page.locator(".recipientOrderNavigation__submit").click();
  await expect(page.getByRole("button", { name: "Отменить оформление и изменить корзину" })).toBeVisible();
  expect(server.checkouts()).toBe(1);
  expect(server.invoices()).toBe(0);
  await page.getByRole("button", { name: "Отменить оформление и изменить корзину" }).click();
  await expect(page.getByRole("button", { name: "Увеличить количество: Худи" })).toBeEnabled();
  await expect(page.getByText(/Все изделия и вышивка:/)).toBeVisible();
  expect(server.items).toHaveLength(1);
  expect([...server.orders.values()][0].paymentStatus).toBe("cancelled");
});

test("a previous standalone invoice is never reused to pay the basket", async ({ page, context }) => {
  const server = await setup(context);
  await savedBasket(page);
  await page.getByRole("button", { name: "Подставить прежний одиночный заказ" }).click();
  await page.getByRole("button", { name: "Открыть сохранённую корзину" }).click();
  await expect.poll(async () => (await state(page)).recipient.savedOrder).toBeNull();
  await expect(page.locator(".recipientOrderNavigation__submit")).toBeEnabled();
  await page.locator(".recipientOrderNavigation__submit").click();
  await expect(page.getByRole("heading", { name: "PayKeeper test checkout" })).toBeVisible();
  expect(server.checkouts()).toBe(1);
  expect(server.invoices()).toBe(1);
  expect(server.orders.has(99)).toBe(false);
});

test("one certificate discounts all merchandise, not delivery, and zero-due orders skip the bank", async ({ page, context }) => {
  const server = await setup(context);
  server.freeDelivery();
  await savedBasket(page);
  await page.getByLabel("Промокод", { exact: true }).fill(`ITS${"A".repeat(32)}`);
  await page.getByRole("button", { name: "Применить", exact: true }).click();
  await expect(page.getByText(/Сертификат: −/)).toContainText("9 000");
  await expect(page.locator(".recipientOrderNavigation__submit")).toHaveText("оформить заказ");
  await page.locator(".recipientOrderNavigation__submit").click();
  await expect(page.getByRole("heading", { name: "спасибо за заказ", exact: true })).toBeVisible();
  expect(server.invoices()).toBe(0);
  expect(server.checkouts()).toBe(1);
  expect([...server.orders.values()][0].paymentProvider).toBe("certificate");
});

test("unfinished garment and text survive a browser restart without storing contacts or cached prices", async ({ page, context, browser }) => {
  const server = await setup(context);
  await page.goto(`${fixture}?order=1`);
  expect(await constructorRecord(page)).toBeNull();
  await selectGarment(page);
  await page.locator('.orderNavigation .orderActionButton--next').click();
  await page.locator('.embroideryDesktopTabs button').nth(1).click();
  await page.getByPlaceholder("Введите надпись").fill("Мой новый черновик");
  await expect.poll(async () => (await constructorRecord(page)).draft.embroidery.customText).toBe("Мой новый черновик");
  const before = await constructorRecord(page);
  expect(before.draft).not.toHaveProperty("recipient");
  expect(before.draft.clothing).not.toHaveProperty("profile");
  expect(before.draft.embroidery).not.toHaveProperty("price");
  const reopened = await browser.newContext({ storageState: await context.storageState() });
  try {
    await server.mount(reopened); const restored = await reopened.newPage();
    await restored.goto(`${fixture}?order=1`);
    await expect(restored.locator('input[name="clothing"][value="Hoodie"]')).toBeChecked();
    await expect(restored.locator('input[name="size"][value="M"]')).toBeChecked();
    await expect(restored.getByRole("button", { name: "White", exact: true })).toHaveClass(/active/);
    expect((await constructorRecord(restored)).expiresAt).toBe(before.expiresAt);
    await restored.locator('.orderNavigation .orderActionButton--next').click();
    await expect(restored.getByPlaceholder("Введите надпись")).toHaveValue("Мой новый черновик");
    expect(server.items).toHaveLength(0);
  } finally { await reopened.close(); }
});

test("a restored photo draft explains missing Files without a standalone discard button", async ({ page, context, browser }) => {
  const server = await setup(context);
  await page.goto(`${fixture}?order=1`); await selectGarment(page);
  await page.getByLabel("Фото для теста").setInputFiles({ name: "car.png", mimeType: "image/png", buffer: png });
  await page.getByRole("button", { name: "Добавить фото в черновик" }).click();
  await expect.poll(async () => (await constructorRecord(page)).draft.uploadFiles.length).toBe(1);
  await expect(page.getByRole("button", { name: "Удалить черновик", exact: true })).toHaveCount(0);
  await expect(page.locator(".orderDraftNotice")).toHaveCount(0);
  expect((await state(page)).files).toEqual(["car.png"]);
  const reopened = await browser.newContext({ storageState: await context.storageState() });
  try {
    await server.mount(reopened); const restored = await reopened.newPage();
    await restored.goto(`${fixture}?order=1`);
    await expect(restored.locator('input[name="size"][value="M"]')).toBeChecked();
    await restored.locator('.orderNavigation .orderActionButton--next').click();
    await expect(restored.locator('.embroideryRestoreNotice')).toContainText("Загрузите фотографии повторно");
    expect((await state(restored)).files).toEqual([]);
    await expect(restored.getByRole("button", { name: "Удалить черновик", exact: true })).toHaveCount(0);
    expect((await constructorRecord(restored)).draft.uploadFiles[0].name).toBe("car.png");
    expect((await state(restored)).missingUploadFiles[0].name).toBe("car.png");
  } finally { await reopened.close(); }
  expect(server.items).toHaveLength(0);
});

test("unfinished cart row blocks payment until continued or explicitly removed, without charging or deleting ready garments", async ({ page, context }) => {
  const server = await setup(context);
  await savedBasket(page);
  await page.getByRole("button", { name: "Создать ещё одно изделие", exact: true }).click();
  await selectGarment(page);
  await page.getByLabel("Фото для теста").setInputFiles({ name: "car.png", mimeType: "image/png", buffer: png });
  await page.getByRole("button", { name: "Добавить фото в черновик" }).click();
  await page.getByRole("button", { name: "Открыть сохранённую корзину" }).click();
  const list = page.getByRole("list", { name: "Изделия в корзине" });
  await expect(list.locator("li")).toHaveCount(2);
  await expect(list).toContainText("Незавершённое изделие — не входит в сумму");
  await expect(page.locator('.recipientCart__total')).toContainText("9 000");
  await expect(page.locator('.recipientOrderNavigation__submit')).toBeDisabled();
  await expect(page.getByRole("link", { name: "Продолжить оформление", exact: true })).toHaveAttribute("href", "/order");
  const removeDraft = page.getByRole("button", { name: "Удалить изделие: Hoodie, White, M", exact: true });
  page.once("dialog", (dialog) => dialog.dismiss());
  await removeDraft.click();
  await expect(list.locator("li")).toHaveCount(2);
  expect((await state(page)).files).toEqual(["car.png"]);
  page.once("dialog", (dialog) => dialog.accept());
  await removeDraft.click();
  await expect(list.locator("li")).toHaveCount(1);
  await expect(page.locator('.recipientOrderNavigation__submit')).toBeEnabled();
  expect(server.items).toHaveLength(1); expect(server.invoices()).toBe(0);
  expect((await constructorRecord(page)).draft).toBeNull();
});

test("expired constructors do not return from an old session draft", async ({ page, context }) => {
  await setup(context); await page.goto(`${fixture}?order=1`); await selectGarment(page);
  await page.evaluate(() => {
    const legacy = JSON.parse(sessionStorage.getItem("its_order_draft_v1"));
    delete legacy.constructorRevision;
    legacy.order.clothing = { type: "T-shirt", color: "Blue", size: "M" };
    sessionStorage.setItem("its_order_draft_v1", JSON.stringify(legacy));
  });
  await page.reload();
  await expect(page.locator('input[name="clothing"][value="Hoodie"]')).toBeChecked();
  await expect.poll(async () => (await constructorRecord(page)).draft.clothing.color).toBe("White");
  await page.evaluate((key) => {
    const record = JSON.parse(localStorage.getItem(key));
    record.updatedAt = Date.now() - 30 * 24 * 60 * 60 * 1000 - 1000;
    record.expiresAt = record.updatedAt + 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem(key, JSON.stringify(record));
  }, constructorKey);
  await page.reload();
  await expect(page.locator('input[name="size"]:checked')).toHaveCount(0);
  await expect(page.locator('.orderNavigation .orderActionButton--next')).toBeDisabled();
  await expect.poll(async () => (await constructorRecord(page)).draft).toBeNull();
});

test("an older open tab cannot overwrite or resurrect a newer constructor", async ({ page, context }) => {
  await setup(context); await page.goto(`${fixture}?order=1`); await selectGarment(page);
  const newer = await context.newPage(); await newer.goto(`${fixture}?order=1`);
  await expect(newer.locator('input[name="size"][value="M"]')).toBeChecked();
  await newer.getByRole("button", { name: "Black", exact: true }).click();
  await newer.locator('.sizeSelector__item:has(input[value="L"]) .sizeSelector__box').click();
  await expect.poll(async () => (await constructorRecord(newer)).draft.clothing.size).toBe("L");
  await expect(page.locator('.orderDraftNotice')).toContainText("другой вкладке");
  await expect(page.getByRole("button", { name: "Удалить черновик", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Black", exact: true }).click();
  expect((await constructorRecord(newer)).draft.clothing).toEqual({ type: "Hoodie", color: "Black", size: "L" });
});

test("blocked persistent storage explains the limitation but does not prevent in-memory ordering", async ({ page, context }) => {
  await setup(context);
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (this === window.localStorage) throw new DOMException("blocked", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await page.goto(`${fixture}?order=1`);
  await page.locator('.selectorType__item:has(input[value="Hoodie"])').click();
  await page.locator('.sizeSelector__item:has(input[value="M"]) .sizeSelector__box').click();
  await expect(page.locator('.orderDraftNotice')).toContainText("Не удалось сохранить черновик");
  await expect(page.locator('.orderNavigation .orderActionButton--next')).toBeEnabled();
  expect((await state(page)).clothing.size).toBe("M");
});

test("accepted uploads are reconciled after a browser restart without resurrecting a duplicate unfinished garment", async ({ page, context, browser }) => {
  const server = await setup(context);
  await page.goto(`${fixture}?resume=1`); await seed(page);
  await page.locator('.recipientOrderForm__consent input').check();
  server.loseNextResponse(); await add(page).click();
  await expect(page.getByRole("alert")).toContainText("недоступна");
  const reopened = await browser.newContext({ storageState: await context.storageState() });
  try {
    await server.mount(reopened); const restored = await reopened.newPage();
    await restored.goto(`${fixture}?order=1`);
    await expect(restored.getByRole("link", { name: /Открыть корзину/ })).toBeVisible();
    await expect.poll(async () => (await constructorRecord(restored)).draft).toBeNull();
    expect((await state(restored)).files).toEqual([]);
    expect((await state(restored)).clothing.size).toBe("");
    expect(server.items).toHaveLength(1); expect(server.keys).toHaveLength(1);
  } finally { await reopened.close(); }
});
