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
  let loseResponse = false;
  let rejectQuantity = false;
  const snapshot = () => ({ id: access.id, expiresAt: access.expiresAt, items,
    merchandisePrice: items.some((item) => item.linePrice == null) ? null : items.reduce((sum, item) => sum + item.linePrice, 0) });
  const mount = async (target) => {
    await target.route("**/e2e/catalog-hoodie.png", (route) => route.fulfill({ contentType: "image/png", body: png }));
    await target.route("**/api/cart/**", async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const reply = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
      if (path.endsWith("/session")) return reply(access, 201);
      if (request.headers()["x-cart-access-token"] !== access.token) return reply({ code: "cart_access_required", message: "Нет доступа" }, 401);
      if (request.method() === "POST") {
        const key = request.headers()["idempotency-key"];
        keys.push(key);
        let item = items.find((entry) => entry.requestKey === key);
        if (!item) {
          item = { id: randomUUID(), requestKey: key, productType: "Худи", color: "Чёрный", size: "M", imageUrl: "/e2e/catalog-hoodie.png",
            embroideryType: "Patronus", patronusCount: 4, petFaceCount: 1, quantity: 1, unitPrice: 9000, linePrice: 9000, attachments: [] };
          items.push(item);
        }
        if (loseResponse) { loseResponse = false; return route.abort(); }
        return reply({ ...snapshot(), addedItemId: item.id });
      }
      if (request.method() === "PATCH") {
        if (rejectQuantity) return reply({ message: "Для выбранного количества недостаточно изделий на складе", code: "cart_stock_unavailable" }, 409);
        const item = items.find((entry) => path.endsWith(entry.id));
        item.quantity = request.postDataJSON().quantity;
        item.linePrice = item.unitPrice * item.quantity;
      }
      if (request.method() === "DELETE") items.splice(items.findIndex((entry) => path.endsWith(entry.id)), 1);
      return reply(snapshot());
    });
  };
  await mount(context);
  return { access, items, keys, mount, loseNextResponse: () => { loseResponse = true; }, rejectIncrease: () => { rejectQuantity = true; } };
};
const seed = async (page) => {
  await page.getByLabel("Фото для теста").setInputFiles({ name: "pet.png", mimeType: "image/png", buffer: png });
  await page.getByRole("button", { name: "Подготовить худи" }).click();
  await expect(page.getByRole("heading", { name: "Введите свои данные" })).toBeVisible();
};
const add = (page) => page.getByRole("button", { name: "Добавить в корзину", exact: true });

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
  await expect(page.locator(".recipientOrderNavigation__submit")).toBeDisabled();
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
