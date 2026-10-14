import { expect, test } from "@playwright/test";

test.setTimeout(60_000);
const token = "fixture-order-token";
const individualText = "В ближайшее время мы свяжемся с вами и уточним детали индивидуальной вышивки";

const blockExternalApis = async (page) => {
  await page.route("**/api/**", (route) => route.abort());
  await page.route("**/service.php**", (route) => route.abort());
};

const openPaymentReturn = async (page, { hasBuyerEmail = true, paymentStatus = "paid" } = {}) => {
  await blockExternalApis(page);
  await page.addInitScript((accessToken) => {
    sessionStorage.setItem("pay_order_id", "42");
    sessionStorage.setItem("order_access:42", accessToken);
  }, token);
  const state = { status: "Оплачено", paymentStatus, paymentProvider: "paykeeper", hasBuyerEmail };
  await page.route("**/api/orders/42", (route) => {
    expect(route.request().headers()["x-order-access-token"]).toBe(token);
    return route.fulfill({ json: state });
  });
  await page.goto("/payment-success");
  return state;
};

test("подтверждённая оплата показывает макет результата без переполнения на всех ширинах", async ({ page }, info) => {
  await openPaymentReturn(page);
  const title = page.getByRole("heading", { name: "спасибо за заказ", exact: true });
  await expect(title).toBeVisible();
  await expect(title).toBeFocused();
  await expect(page.getByText("Заказ успешно оплачен! Чек придёт вам на почту", { exact: true })).toBeVisible();
  await expect(page.locator(".thx__order-number")).toHaveText("42");
  const links = page.getByRole("navigation", { name: "Связаться с нами", exact: true }).getByRole("link");
  await expect(links).toHaveCount(3);
  await expect(links.nth(0)).toHaveAccessibleName("Instagram — связаться с нами");
  await page.keyboard.press("Tab");
  await expect(links.nth(0)).toBeFocused();
  const widths = info.project.name.startsWith("desktop") ? [1920, 1440, 1200, 1199, 820, 640] : [320, 390, 428, 639];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const images = await page.locator(".thx__socialLink img").evaluateAll((elements) => elements.map((element) => ({
      loaded: element.complete && element.naturalWidth > 0,
      width: element.getBoundingClientRect().width,
      height: element.getBoundingClientRect().height,
      naturalWidth: element.naturalWidth,
      naturalHeight: element.naturalHeight,
    })));
    expect(images.every((image) => image.loaded && Math.abs(image.width - image.height) < 1 && image.naturalWidth === image.naturalHeight)).toBe(true);
    if (width === 1920) {
      expect((await page.locator(".thx__stage").boundingBox()).height).toBeCloseTo(840, 0);
      expect((await page.locator(".thx__card").boundingBox()).width).toBeCloseTo(1200, 0);
      expect((await page.locator(".thx__content").boundingBox()).height).toBeCloseTo(584, 0);
    }
    await page.locator(".thx").screenshot({ path: info.outputPath(`paid-result-${width}.png`) });
  }
  await page.getByRole("link", { name: "на главную", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("оплата без email не обещает отправку чека на почту", async ({ page }) => {
  await openPaymentReturn(page, { hasBuyerEmail: false });
  await expect(page.getByRole("heading", { name: "спасибо за заказ" })).toBeVisible();
  await expect(page.locator(".thx__text")).toContainText("Заказ успешно оплачен!");
  await expect(page.locator(".thx__text")).not.toContainText("почту");
});

test("страница результата ждёт серверного подтверждения оплаты", async ({ page }) => {
  const state = await openPaymentReturn(page, { paymentStatus: "pending" });
  await expect(page.getByText("Оплата успешно завершена. Подтверждаем заказ…", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/payment-success$/);
  await expect(page.locator(".thx__title")).toHaveCount(0);
  state.paymentStatus = "paid";
  await expect(page.getByRole("heading", { name: "спасибо за заказ" })).toBeVisible();
});

test("прямой вход без оформленного заказа возвращает к конструктору", async ({ page }) => {
  await blockExternalApis(page);
  await page.goto("/thank-you");
  await expect(page).toHaveURL(/\/order$/);
  await expect(page.locator(".thx__title")).toHaveCount(0);
});

const prepareIndividual = async (page, { failCreate = false, failFirstConfirm = false } = {}) => {
  await blockExternalApis(page);
  await page.addInitScript(() => {
    sessionStorage.setItem("its_order_draft_v1", JSON.stringify({ version: 1, uploadFiles: [], order: {
      clothing: { type: "Hoodie", color: "Чёрный", size: "M" },
      embroidery: { type: "custom", typeSelectionExplicit: true, uploadedImage: [], customOption: { image: true, text: false } },
      recipient: { userData: { firstName: "Иван", lastName: "Иванов", middleName: "", phone: "+7 (999) 123-45-67" },
        hasNoMiddleName: true, privacyConsent: true, pickupPoint: "ПВЗ Красноярск", cdek: { mode: "office", address: { code: "KRS1" } } },
    } }));
  });
  const calls = { creates: [], confirms: [], links: [] };
  await page.route("**/api/public-config", (route) => route.fulfill({ json: { turnstile: { enabled: false } } }));
  await page.route("**/api/pricing/quote", (route) => route.fulfill({ json: { prices: { Patronus: 15000, petFace: 8000, Car: 7000, custom: null } } }));
  await page.route("**/api/orders/create", (route) => {
    calls.creates.push(route.request().postData());
    return route.fulfill(failCreate ? { status: 503, json: { message: "Тестовый сбой сохранения" } }
      : { json: { orderId: 42, orderToken: token, pricePending: true, totalPrice: null, paymentAmount: null } });
  });
  await page.route("**/api/orders/confirm/42", (route) => {
    calls.confirms.push({ body: route.request().postDataJSON(), token: route.request().headers()["x-order-access-token"] });
    return route.fulfill(failFirstConfirm && calls.confirms.length === 1
      ? { status: 503, json: { message: "Тестовый сбой подтверждения" } } : { json: { ok: true } });
  });
  await page.route("**/api/payments/paykeeper/link", (route) => {
    calls.links.push(route.request().postData());
    return route.abort();
  });
  await page.goto("/embroidery");
  await page.getByRole("button", { name: "далее", exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: "individual.png", mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aHy4AAAAASUVORK5CYII=", "base64") });
  await page.getByRole("textbox", { name: "Комментарий", exact: true }).fill("Согласовать индивидуальный эскиз");
  await page.getByRole("button", { name: "далее", exact: true }).click();
  await expect(page).toHaveURL(/\/recipient$/);
  await expect(page.getByRole("button", { name: "отправить заявку", exact: true })).toBeEnabled();
  return calls;
};

test("индивидуальная заявка сохраняется и подтверждается без банка", async ({ page }, info) => {
  test.skip(!info.project.name.endsWith("live-checkout"), "Run with test:e2e:completion to avoid the demo shortcut");
  const calls = await prepareIndividual(page);
  await page.getByRole("button", { name: "отправить заявку", exact: true }).click();
  await expect(page.getByRole("heading", { name: "заявка оформлена", exact: true })).toBeVisible();
  await expect(page.getByText(individualText, { exact: true })).toBeVisible();
  await expect(page.locator(".thx__text")).not.toContainText("оплачен");
  await expect(page.locator(".thx__text")).not.toContainText("Чек");
  await expect(page.locator(".thx__order-number")).toHaveText("42");
  expect(calls.creates).toHaveLength(1);
  expect(calls.creates[0]).toContain('name="images"');
  expect(calls.creates[0]).toContain("Согласовать индивидуальный эскиз");
  expect(calls.confirms).toEqual([{ body: { provider: "manual" }, token }]);
  expect(calls.links).toHaveLength(0);
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem("its_order_draft_v1")).order.clothing.type)).toBe("");
  await page.locator(".thx").screenshot({ path: info.outputPath("individual-result.png") });
});

test("ошибка подтверждения сохраняет заявку для повтора, не предлагает оплату и не создаёт дубль", async ({ page }, info) => {
  test.skip(!info.project.name.endsWith("live-checkout"), "Run with test:e2e:completion to avoid the demo shortcut");
  const calls = await prepareIndividual(page, { failFirstConfirm: true });
  const submit = page.getByRole("button", { name: "отправить заявку", exact: true });
  await submit.click();
  await expect(page.getByText(/Заявка уже сохранена — повторите отправку/)).toBeVisible();
  await expect(page.getByText(/повторите оплату/)).toHaveCount(0);
  await expect(page.locator(".thx__title")).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("its_order_draft_v1")).order.recipient.savedOrder.orderId)).toBe(42);
  await submit.click();
  await expect(page.getByRole("heading", { name: "заявка оформлена" })).toBeVisible();
  expect(calls.creates).toHaveLength(1);
  expect(calls.confirms).toHaveLength(2);
  expect(calls.links).toHaveLength(0);
});

test("ошибка сохранения не показывает успешную заявку и не очищает форму", async ({ page }, info) => {
  test.skip(!info.project.name.endsWith("live-checkout"), "Run with test:e2e:completion to avoid the demo shortcut");
  const calls = await prepareIndividual(page, { failCreate: true });
  await page.getByRole("button", { name: "отправить заявку", exact: true }).click();
  await expect(page.getByText("Тестовый сбой сохранения", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/recipient$/);
  await expect(page.locator(".thx__title")).toHaveCount(0);
  expect(calls.confirms).toHaveLength(0);
  expect(calls.links).toHaveLength(0);
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("its_order_draft_v1")).order.embroidery.comment)).toBe("Согласовать индивидуальный эскиз");
});
