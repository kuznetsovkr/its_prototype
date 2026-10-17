/* global window, document, queueMicrotask */
import { test, expect } from "@playwright/test";

test("чекбокс отчества отделён от ФИО, щит виден, старого ручного способа нет", async ({ page }, info) => {
  await page.addInitScript(() => {
    window.turnstile = { render: (_container, options) => { queueMicrotask(() => options.callback("e2e-token")); return 1; }, reset() {}, remove() {} };
  });
  await page.route("**/api/public-config", route => route.fulfill({ json: { turnstile: { enabled: true, siteKey: "1x00000000000000000000AA", action: "order_create" } } }));
  await page.goto("/recipient");
  const fullName = page.locator(".recipientOrderForm__field--fullName");
  await expect(fullName).toBeVisible({ timeout: 20_000 });
  const checkbox = page.locator(".recipientOrderForm__noMiddleName");
  const [nameBox, checkboxBox] = await Promise.all([fullName.boundingBox(), checkbox.boundingBox()]);
  expect(nameBox.y - checkboxBox.y - checkboxBox.height).toBeGreaterThanOrEqual(info.project.use.isMobile ? 5 : 3);
  const shield = page.locator(".recipientOrderForm__turnstileShield");
  await shield.scrollIntoViewIfNeeded();
  await expect(page.getByTestId("turnstile-panel")).toHaveClass(/is-verified/);
  const [circle, icon] = await Promise.all([shield.boundingBox(), shield.locator("svg").boundingBox()]);
  expect(icon.width).toBeGreaterThanOrEqual(16);
  expect(icon.height).toBeGreaterThanOrEqual(18);
  expect(Math.abs(circle.x + circle.width / 2 - icon.x - icon.width / 2)).toBeLessThan(1);
  expect(Math.abs(circle.y + circle.height / 2 - icon.y - icon.height / 2)).toBeLessThan(1);
  await page.locator(".recipientOrderForm").screenshot({ path: info.outputPath("recipient-form-feedback.png") });
  await page.locator(".recipientOrderForm__group--pickup button").click();
  await expect(page.getByRole("dialog", { name: "Выбор пункта СДЭК" })).toBeVisible();
  await expect(page.getByText("В моём городе нет СДЭКа", { exact: true })).toHaveCount(0);
  await expect(page.locator(".manualAddress")).toHaveCount(0);
  await page.getByRole("button", { name: "Select demo pickup point" }).click();
  await expect(page.locator(".recipientCdekDialog")).not.toHaveClass(/is-open/);
  const credit = page.locator(".home-footer__legal-development");
  await expect(credit).toHaveText("Разработка сайта — Кирилл Кузнецов");
  await expect(credit).toHaveAccessibleName(info.project.use.isMobile ? "Разработка сайта — Кирилл Кузнецов" : "Разработка сайта");
  await expect(credit).toHaveAttribute("href", "https://t.me/krkuznetsov");
});

test("подпись разработчика скрывает имя только на десктопе и не перекрывает ссылки", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop-chromium", "Матрица всех ширин");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".home-footer__legal-development")).toBeAttached({ timeout: 20_000 });
  await page.evaluate(() => document.fonts.ready);
  for (const width of [320, 390, 640, 820, 1199, 1200, 1440, 2560]) {
    await page.setViewportSize({ width, height: 900 });
    const credit = page.locator(".home-footer__legal-development");
    await expect(credit).toHaveAccessibleName(width >= 1200 ? "Разработка сайта" : "Разработка сайта — Кирилл Кузнецов");
    await expect(credit).toHaveAttribute("href", "https://t.me/krkuznetsov");
    await expect(credit).toHaveAttribute("target", "_blank");
    const links = page.locator(".home-footer__legal > a");
    const boxes = await links.evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom };
    }));
    for (const box of boxes) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(width);
    }
    for (let first = 0; first < boxes.length; first++) {
      for (let second = first + 1; second < boxes.length; second++) {
        const a = boxes[first], b = boxes[second];
        expect(a.right <= b.x + 1 || b.right <= a.x + 1 || a.bottom <= b.y + 1 || b.bottom <= a.y + 1).toBe(true);
      }
    }
  }
});
