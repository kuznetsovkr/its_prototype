/* global window, document, localStorage */
import { test, expect } from "@playwright/test";

const baseNotice = { enabled: true, text: "Актуальные сроки изготовления изделий: 15–18 декабря", additionalText: "", version: "first", nextChangeAt: null };
const settings = { enabled: true, mode: "manual", manualText: baseNotice.text, autoTemplate: "Актуальные сроки изготовления изделий: {dates}", additionalText: "", revision: 1 };
const dialog = (page) => page.getByRole("dialog", { name: "Актуальные сроки изготовления", exact: true });
test.setTimeout(90_000);
test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: "reduce" }); });

test("сроки по макету: клавиатура, фото, сеанс, новая версия и повтор перед оформлением", async ({ page }, info) => {
  let notice = { ...baseNotice };
  await page.route("**/api/production-notice", (route) => route.fulfill({ json: notice }));
  await page.goto("/");
  await expect(dialog(page)).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => document.fonts.ready);
  const photo = page.locator(".productionNoticeCard__photo img");
  await expect.poll(() => photo.evaluate((node) => node.complete && node.naturalWidth > 0)).toBe(true);
  const desktop = !info.project.use.isMobile;
  expect((await dialog(page).boundingBox()).width).toBeCloseTo(desktop ? 440 : 290, 0);
  expect((await photo.boundingBox()).height).toBeCloseTo(desktop ? 404 : 220, 0);
  await expect(page.getByRole("button", { name: "Закрыть уведомление о сроках" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "хорошо", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Закрыть уведомление о сроках" })).toBeFocused();
  await dialog(page).screenshot({ path: info.outputPath("deadline-short.png") });
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveCount(0);
  await expect(page.locator("#root")).not.toHaveAttribute("inert", "");
  await page.reload();
  await expect(page.locator(".home-header__logo")).toBeVisible({ timeout: 20_000 });
  await expect(dialog(page)).toHaveCount(0);
  await page.goto("/recipient");
  await expect(page.locator(".productionNoticeInline")).toContainText(notice.text);
  await expect(dialog(page)).toHaveCount(0);
  notice = { ...notice, additionalText: "Пожалуйста, учитывайте сроки при оформлении заказа.", version: "second" };
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page)).toContainText(notice.additionalText);
  await dialog(page).screenshot({ path: info.outputPath("deadline-expanded.png") });
  await page.getByRole("button", { name: "хорошо", exact: true }).click();
  await expect(page.locator(".productionNoticeInline")).toContainText(notice.additionalText);
  await page.goto("/certificate");
  await expect(page.locator(".certificatePage")).toBeVisible({ timeout: 20_000 });
  await expect(dialog(page)).toHaveCount(0);
  await expect(page.locator(".productionNoticeInline")).toHaveCount(0);
});

test("планшет, маленький экран, длинный текст, закрытие фоном и недоступный API", async ({ page }, info) => {
  test.skip(info.project.use.isMobile, "Матрица ширин в одном браузере");
  let version = 0;
  await page.route("**/api/production-notice", (route) => route.fulfill({ json: { ...baseNotice, additionalText: "Информация о сроках. ".repeat(20), version: `width-${++version}` } }));
  for (const width of [320, 640, 820, 1199, 1200, 2560]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await expect(dialog(page)).toBeVisible({ timeout: 20_000 });
    const bounds = await dialog(page).boundingBox();
    expect(bounds.width).toBeCloseTo(width < 1200 ? 290 : 440, 0);
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(bounds.height).toBeLessThanOrEqual(768);
    await page.getByRole("button", { name: "хорошо", exact: true }).click();
  }
  await page.setViewportSize({ width: 320, height: 420 });
  await page.goto("/");
  await expect(dialog(page)).toBeVisible();
  await page.getByRole("button", { name: "хорошо", exact: true }).click();
  await expect(dialog(page)).toHaveCount(0);
  await page.goto("/");
  await expect(dialog(page)).toBeVisible();
  await page.locator(".productionNoticeOverlay").click({ position: { x: 2, y: 2 } });
  await expect(dialog(page)).toHaveCount(0);
  await page.route("**/api/production-notice", (route) => route.fulfill({ status: 500, json: { message: "fixture unavailable" } }));
  await page.goto("/recipient");
  await expect(page.locator(".recipientOrderCard")).toBeVisible({ timeout: 20_000 });
  await expect(dialog(page)).toHaveCount(0);
  await expect(page.locator(".productionNoticeInline")).toHaveCount(0);
});

test("админка сохраняет сроки, даёт предпросмотр обоих режимов и выключает уведомление", async ({ page }) => {
  let draft = { ...settings };
  await page.addInitScript(() => localStorage.setItem("token", "fixture-token"));
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/admin-session") return route.fulfill({ json: { role: "super_admin", name: "Владелец" } });
    if (path === "/api/production-notice") return route.fulfill({ json: { enabled: draft.enabled, text: draft.manualText, additionalText: draft.additionalText, version: String(draft.revision), nextChangeAt: null } });
    if (path === "/api/admin/production-notice") {
      if (route.request().method() === "PUT") draft = { ...route.request().postDataJSON(), revision: draft.revision + 1 };
      return route.fulfill({ json: { settings: draft, automaticDates: "15–17 декабря" } });
    }
    if (path.startsWith("/api/admin/")) return route.fulfill({ json: { items: [], total: 0 } });
    if (path === "/api/pricing/config") return route.fulfill({ json: { types: [], additional: {} } });
    return route.fulfill({ json: [] });
  });
  await page.goto("/admin/inventory");
  const panel = page.locator(".admin-production-notice");
  await expect(panel.getByLabel("Основной текст", { exact: true })).toBeVisible({ timeout: 20_000 });
  await panel.getByLabel("Основной текст", { exact: true }).fill("Готовность: 20–22 декабря");
  await panel.getByLabel("Дополнительный текст (необязательно)", { exact: true }).fill("Срок можно уточнить у менеджера.");
  await expect(panel.locator(".productionNoticeCard__text")).toContainText("Готовность: 20–22 декабря");
  await panel.getByRole("button", { name: "Сохранить сроки", exact: true }).click();
  await expect(panel.getByRole("status")).toContainText("Сроки сохранены");
  expect(draft.manualText).toBe("Готовность: 20–22 декабря");
  await panel.getByLabel("Режим сроков").selectOption("auto");
  await expect(panel.locator(".productionNoticeCard__text")).toContainText("15–17 декабря");
  await panel.getByRole("button", { name: "Сохранить сроки", exact: true }).click();
  await expect(panel.getByRole("status")).toContainText("Сроки сохранены");
  expect(draft.mode).toBe("auto");
  await panel.screenshot({ path: test.info().outputPath("deadline-admin.png") });
  await panel.getByLabel("Показывать сроки на сайте и перед оформлением").uncheck();
  await panel.getByRole("button", { name: "Сохранить сроки", exact: true }).click();
  await expect(panel.getByRole("status")).toContainText("Сроки сохранены");
  expect(draft.enabled).toBe(false);
  await page.goto("/");
  await expect(page.locator(".home-header__logo")).toBeVisible({ timeout: 20_000 });
  await expect(dialog(page)).toHaveCount(0);
});

test("уведомление ждёт закрытия другого окна и работает без sessionStorage", async ({ page }) => {
  let deliverNotice;
  const released = new Promise((resolve) => { deliverNotice = resolve; });
  await page.route("**/api/production-notice", async (route) => { await released; await route.fulfill({ json: baseNotice }); });
  await page.addInitScript(() => {
    Object.defineProperty(window, "sessionStorage", { get() { throw new Error("fixture blocked storage"); } });
  });
  await page.goto("/recipient");
  await page.locator(".recipientOrderForm__group--pickup button").click();
  await expect(page.getByRole("dialog", { name: "Выбор пункта СДЭК" })).toBeVisible();
  deliverNotice();
  await expect(dialog(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Select demo pickup point" }).click();
  await expect(dialog(page)).toBeVisible();
  await page.getByRole("button", { name: "хорошо", exact: true }).click();
  await expect(dialog(page)).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.locator(".productionNoticeInline")).toContainText(baseNotice.text);
  await expect(dialog(page)).toHaveCount(0);
});
