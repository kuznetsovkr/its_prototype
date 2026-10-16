/* global document, getComputedStyle, innerWidth, localStorage, sessionStorage, URL */
import { test, expect } from "@playwright/test";

test.setTimeout(60_000);
const access = { version: 1, id: "01234567-89ab-4cde-8fab-0123456789ab", token: "a".repeat(64), expiresAt: "2030-01-01T00:00:00.000Z" };
const seed = async (page, count = 2) => {
  let items = Array.from({ length: count }, (_, index) => ({ id: `01234567-89ab-4cde-8fab-${String(index + 1).padStart(12, "0")}`, requestKey: String(index), productType: index ? "Футболка" : "Худи",
    color: "Чёрный", size: "M", embroideryType: "Car", quantity: 1, unitPrice: 6000, linePrice: 6000, imageUrl: "/favicon.svg" }));
  let fail = false;
  const updates = [];
  await page.addInitScript((record) => localStorage.setItem("its_cart_access_v1", JSON.stringify(record)), access);
  await page.route("**/api/cart/**", async (route) => {
    const request = route.request();
    const itemId = new URL(request.url()).pathname.split("/").at(-1);
    if (request.method() === "PATCH") {
      updates.push(request.postDataJSON());
      if (fail) return route.fulfill({ status: 409, json: { message: "Недостаточно изделий на складе" } });
      const item = items.find((entry) => entry.id === itemId);
      item.quantity = request.postDataJSON().quantity; item.linePrice = item.unitPrice * item.quantity;
    }
    if (request.method() === "DELETE") items = items.filter((item) => item.id !== itemId);
    return route.fulfill({ json: { id: access.id, items, revision: updates.length, expiresAt: access.expiresAt,
      merchandisePrice: items.reduce((sum, item) => sum + item.linePrice, 0) } });
  });
  await page.route("**/api/public-config", (route) => route.fulfill({ json: { turnstile: { enabled: false } } }));
  return { updates, reject: () => { fail = true; } };
};
const open = async (page) => {
  const button = page.getByRole("button", { name: /^Открыть корзину/ });
  await button.click();
  const dialog = page.getByRole("dialog", { name: "Ваш заказ", exact: true });
  await expect(dialog).toBeVisible();
  await expect.poll(async () => {
    const box = await dialog.boundingBox();
    return Math.round(box.x + box.width);
  }).toBe(page.viewportSize().width);
  await expect(dialog.getByRole("button", { name: "Закрыть корзину" })).toBeFocused();
  return { button, dialog };
};

test("корзина выезжает справа, управляется клавиатурой и использует реальные серверные количества", async ({ page }, info) => {
  const api = await seed(page);
  await page.goto("/");
  const { button, dialog } = await open(page);
  await expect(button).toHaveAccessibleName("Открыть корзину, изделий: 2");
  await expect(dialog.getByRole("listitem")).toHaveCount(2);
  await expect(dialog).toContainText(/Цена: 12\s*000 ₽/);
  expect(await page.locator("#root").evaluate((element) => element.inert)).toBe(true);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  await expect.poll(async () => Math.round((await dialog.boundingBox()).x + (await dialog.boundingBox()).width)).toBe(page.viewportSize().width);
  expect(Math.round((await dialog.boundingBox()).height)).toBe(page.viewportSize().height);
  const close = dialog.getByRole("button", { name: "Закрыть корзину" });
  await expect(dialog.getByRole("button", { name: "Оформить заказ" })).toBeEnabled();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Оформить заказ" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await dialog.getByRole("button", { name: "Увеличить количество: Худи" }).click();
  await expect(dialog).toContainText("2 шт");
  await expect(dialog).toContainText(/Цена: 18\s*000 ₽/);
  expect(api.updates).toEqual([{ quantity: 2 }]);
  await expect(button).toHaveAccessibleName("Открыть корзину, изделий: 3");
  await expect(button.locator(".home-header__cart-count")).toHaveText("3");
  await page.screenshot({ path: info.outputPath("cart-drawer.png") });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText("У вас есть сохранённые изделия.", { exact: true })).toHaveCount(0);
  await expect(page.locator(".orderCartShortcut").filter({ hasText: "Открыть корзину" })).toHaveCount(0);
  await expect(button).toBeFocused();
  expect(await page.locator("#root").evaluate((element) => element.inert)).toBe(false);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
  await open(page);
  await page.getByRole("button", { name: "Закрыть корзину" }).click();
  await expect(dialog).toHaveCount(0);
  if (info.project.name === "desktop-chromium") {
    await open(page);
    await page.locator(".cartDrawerOverlay").click({ position: { x: 20, y: 20 } });
    await expect(dialog).toHaveCount(0);
  }
  await open(page);
  await dialog.getByRole("button", { name: "Оформить заказ" }).click();
  await expect(page).toHaveURL(/\/recipient\?cart=1$/);
  await expect(dialog).toHaveCount(0);
});

test("ошибка количества не меняет корзину, удаление и пустое состояние работают", async ({ page }) => {
  const api = await seed(page, 1);
  await page.goto("/");
  const { dialog } = await open(page);
  api.reject();
  await dialog.getByRole("button", { name: "Увеличить количество: Худи" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Недостаточно изделий на складе");
  await expect(dialog).toContainText("1 шт");
  await dialog.getByRole("button", { name: "Повторить загрузку корзины" }).click();
  await expect(dialog.getByRole("alert")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Удалить изделие: Худи, Чёрный, M" }).click();
  await expect(dialog).toContainText("В корзине пока нет изделий.");
  await expect(dialog.getByRole("button", { name: "Оформить заказ" })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(page.locator(".home-header__cart-count")).toHaveCount(0);
  expect(await page.evaluate(() => document.activeElement.matches('.home-header__logo, .home-header__icon-link'))).toBe(true);
});

test("длинная корзина прокручивается внутри панели, не расширяя страницу", async ({ page }) => {
  await seed(page, 12);
  await page.goto("/");
  const { dialog } = await open(page);
  await expect(dialog.getByRole("listitem")).toHaveCount(12);
  const body = dialog.locator(".cartDrawer__body");
  expect(await body.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  await dialog.getByRole("button", { name: "Оформить заказ" }).scrollIntoViewIfNeeded();
  expect(await body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("незавершённое изделие не выдаётся за оплаченную позицию", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("its_order_draft_v1", JSON.stringify({ version: 1, uploadFiles: [], order: {
    clothing: { type: "Hoodie", color: "Чёрный", size: "M", profile: { name: "Худи" } }, embroidery: {}, recipient: {},
  } })));
  await page.goto("/");
  const { dialog } = await open(page);
  await expect(dialog).toContainText("Незавершённое изделие — не входит в сумму");
  await expect(dialog.getByRole("link", { name: "Продолжить оформление" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Оформить заказ" })).toBeDisabled();
  await expect(dialog.locator(".recipientCart__quantity")).toHaveCount(0);
  await expect(dialog.locator(".recipientCart__total")).toHaveCount(0);
});

test("корзина открывается из мобильного меню и возвращает фокус в шапку", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile-chromium", "Мобильное меню");
  await seed(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Открыть меню", exact: true }).click();
  await page.locator(".home-header__menu-bag").click();
  const dialog = page.getByRole("dialog", { name: "Ваш заказ" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".home-header__mobile-actions button")).toBeFocused();
  await expect(page.getByRole("dialog", { name: "Мобильное меню" })).not.toBeVisible();
});

test("иконка и счётчик не перекрывают навигацию на границах планшета и десктопа", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop-chromium", "Матрица ширин");
  await seed(page);
  await page.goto("/");
  const bag = page.locator(".home-header__desktop-cart");
  await expect(bag).toBeVisible();
  for (const width of [640, 820, 1199, 1200, 1280, 1920, 2560]) {
    await page.setViewportSize({ width, height: 900 });
    const [logo, nav, order, button] = await Promise.all([
      page.locator(".home-header__logo").boundingBox(), page.locator(".home-header__navigation").boundingBox(),
      page.locator(".home-header__order").boundingBox(), bag.boundingBox(),
    ]);
    expect(logo.x + logo.width).toBeLessThanOrEqual(nav.x + 1);
    expect(nav.x + nav.width).toBeLessThanOrEqual(order.x + 1);
    expect(order.x + order.width).toBeLessThanOrEqual(button.x + 1);
    expect(Math.abs(order.x + order.width - button.x)).toBeLessThanOrEqual(1);
    expect(await bag.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(188, 88, 35)");
    expect(await bag.locator("img").evaluate((element) => getComputedStyle(element).filter)).toContain("invert(1)");
    if (width === 1920) {
      expect(order.x).toBeCloseTo(1670, 0);
      expect(order.width).toBe(150);
      expect(button.x).toBeCloseTo(1820, 0);
      expect(button.width).toBe(56);
    }
  }
});

test("мобильная корзина соответствует макету 320px и пропорционально адаптируется", async ({ page }, info) => {
  test.skip(!info.project.use.isMobile, "Мобильный макет");
  await seed(page, 3);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/");
  const { button, dialog } = await open(page);
  await expect(dialog.getByRole("listitem")).toHaveCount(3);
  const back = dialog.getByRole("button", { name: "Вернуться к странице" });
  const close = dialog.getByRole("button", { name: "Закрыть корзину" });
  const header = dialog.locator("h1");
  const body = dialog.locator(".cartDrawer__body");
  const card = dialog.locator(".recipientCart");
  const checkout = dialog.getByRole("button", { name: "Оформить заказ" });
  await expect(checkout).toBeEnabled();
  await page.evaluate(() => document.fonts.ready);
  for (const width of [320, 360, 390, 430, 639]) {
    await page.setViewportSize({ width, height: 900 });
    await body.evaluate((element) => { element.scrollTop = 0; });
    const ratio = width / 320;
    const boxes = await Promise.all([header, back, close, card, checkout, card.locator(".recipientCart__image").first()].map((item) => item.boundingBox()));
    const [headingBox, backBox, closeBox, cardBox, checkoutBox, imageBox] = boxes;
    expect(Math.abs(headingBox.x + headingBox.width / 2 - width / 2)).toBeLessThan(1);
    expect(headingBox.y).toBeCloseTo(37 * ratio, 0);
    expect(backBox.x).toBeCloseTo(23 * ratio, 0);
    expect(closeBox.x + closeBox.width).toBeCloseTo(width - 23 * ratio, 0);
    expect(backBox.y).toBeCloseTo(30 * ratio, 0);
    expect(backBox.width).toBeCloseTo(40 * ratio, 0);
    expect(cardBox.x).toBeCloseTo(6 * ratio, 0);
    expect(cardBox.y).toBeCloseTo(86 * ratio, 0);
    expect(cardBox.width).toBeCloseTo(308 * ratio, 0);
    expect(cardBox.height).toBeCloseTo(411 * ratio, 0);
    expect(imageBox.width).toBeCloseTo(100 * ratio, 0);
    expect(imageBox.height).toBeCloseTo(imageBox.width, 0);
    expect(checkoutBox.x).toBeCloseTo(23 * ratio, 0);
    expect(checkoutBox.width).toBeCloseTo(274 * ratio, 0);
    expect(checkoutBox.y).toBeCloseTo(513 * ratio, 0);
    expect(checkoutBox.height).toBeCloseTo(40 * ratio, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 320 || width === 390) await page.screenshot({ path: info.outputPath(`cart-mobile-design-${width}.png`) });
  }
  await back.click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  await expect(button).toBeFocused();
});

test("мобильная корзина остаётся доступной в низком окне и при повороте", async ({ page }, info) => {
  test.skip(!info.project.use.isMobile, "Мобильные жесты и ориентация");
  await seed(page, 8);
  await page.goto("/");
  const { dialog } = await open(page);
  const body = dialog.locator(".cartDrawer__body");
  for (const viewport of [{ width: 390, height: 500 }, { width: 568, height: 320 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    expect((await dialog.boundingBox()).height).toBe(viewport.height);
    expect(await body.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
    const checkout = dialog.getByRole("button", { name: "Оформить заказ" });
    await checkout.scrollIntoViewIfNeeded();
    await expect(checkout).toBeInViewport();
    await expect(dialog.getByRole("button", { name: "Закрыть корзину" })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(await page.locator("#root").evaluate((element) => element.inert)).toBe(false);
});
