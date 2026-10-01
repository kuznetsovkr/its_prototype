import { expect, test } from "@playwright/test";

test("новые отзывы листаются стрелками без зацикливания", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Десктопная проверка");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const carousel = page.locator(".home-reviews-carousel");
  const viewport = carousel.locator(".home-reviews-carousel__viewport");
  const previous = carousel.getByRole("button", { name: "Предыдущие отзывы" });
  const next = carousel.getByRole("button", { name: "Следующие отзывы" });
  await expect(carousel.locator(".home-reviews-carousel__item")).toHaveCount(6);
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();

  await next.click();
  await expect.poll(() => viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(100);
  await expect(previous).toBeEnabled();

  await carousel.locator(".home-reviews-carousel__dot").last().click();
  await expect.poll(() => viewport.evaluate((element) => (
    Math.abs(element.scrollLeft - (element.scrollWidth - element.clientWidth))
  ))).toBeLessThan(2);
  await expect(next).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
});

for (const viewport of [
  { name: "desktop", width: 1440, height: 900, count: 6, project: "desktop-chromium" },
  { name: "mobile", width: 390, height: 844, count: 5, project: "mobile-chromium" },
  { name: "small-mobile", width: 320, height: 700, count: 5, project: "mobile-chromium" },
]) {
  test(`отзыв можно открыть и закрыть с клавиатуры: ${viewport.name}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== viewport.project, "Проверяем соответствующий браузерный режим");
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");

    const carousel = page.locator(".home-reviews-carousel");
    const cards = carousel.locator(".home-reviews__card-button");
    await expect(cards).toHaveCount(viewport.count);
    await cards.first().focus();
    await page.keyboard.press("Enter");

    const dialog = page.getByRole("dialog", { name: "Отзыв клиента 1" });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("img")).toHaveJSProperty("complete", true);
    expect(await dialog.locator("img").evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(cards.first()).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  });
}

test("мобильные отзывы прокручиваются горизонтально", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Мобильная проверка");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const viewport = page.locator(".home-reviews-carousel__viewport");
  await expect(viewport).toHaveCSS("overflow-x", "auto");
  await viewport.evaluate((element) => element.scrollTo({ left: element.scrollWidth, behavior: "instant" }));
  await expect.poll(() => viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(500);
  await expect(page.locator(".home-reviews-carousel__item")).toHaveCount(5);
});
