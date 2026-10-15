import { expect, test } from "@playwright/test";

test("отзывы циклически листаются стрелками и с клавиатуры", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Десктопная проверка");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const carousel = page.locator(".home-reviews-carousel");
  const viewport = carousel.locator(".home-reviews-carousel__viewport");
  const previous = carousel.getByRole("button", { name: "Предыдущие отзывы" });
  const next = carousel.getByRole("button", { name: "Следующие отзывы" });
  await expect(carousel.locator(".home-reviews-carousel__item")).toHaveCount(6);
  await expect(previous).toBeEnabled();
  await expect(next).toBeEnabled();

  await expect(viewport).toHaveAttribute("data-active-index", "0");
  await previous.click();
  await expect(viewport).toHaveAttribute("data-active-index", "5");
  await page.waitForTimeout(800);
  await next.click();
  await expect(viewport).toHaveAttribute("data-active-index", "0");
  await page.waitForTimeout(800);
  await viewport.focus();
  await page.keyboard.press("End");
  await expect(viewport).toHaveAttribute("data-active-index", "5");
  await page.waitForTimeout(800);
  await page.keyboard.press("ArrowRight");
  await expect(viewport).toHaveAttribute("data-active-index", "0");
  await expect(next).toBeEnabled();
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

test("мобильный горизонтальный жест проходит границу ленты в обе стороны", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Мобильная проверка");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const viewport = page.locator(".home-reviews-carousel__viewport");
  await expect(viewport).toHaveCSS("overflow-x", "auto");
  await viewport.scrollIntoViewIfNeeded();
  const client = await page.context().newCDPSession(page);
  const swipe = async (direction) => {
    const box = await viewport.boundingBox();
    const start = direction < 0 ? box.x + 40 : box.x + box.width - 40;
    const end = direction < 0 ? box.x + box.width - 40 : box.x + 40;
    const y = box.y + box.height / 2;
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: start, y }] });
    for (let step = 1; step <= 12; step += 1) {
      await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: start + (end - start) * step / 12, y }] });
      await page.waitForTimeout(30);
    }
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  };
  await expect(viewport).toHaveAttribute("data-active-index", "0");
  await swipe(-1);
  await expect(viewport).toHaveAttribute("data-active-index", "4");
  await page.waitForTimeout(800);
  await swipe(1);
  await expect(viewport).toHaveAttribute("data-active-index", "0");
  await expect(page.locator(".home-reviews-carousel__item")).toHaveCount(5);
});

test("видимая копия отзыва на стыке тоже открывается", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Проверка стыка десктопной ленты");
  await page.goto("/");
  const carousel = page.locator(".home-reviews-carousel");
  await carousel.locator(".home-reviews-carousel__dot").last().click();
  await expect(carousel.locator(".home-reviews-carousel__viewport")).toHaveAttribute("data-active-index", "5");
  await page.waitForTimeout(800);
  // At the last position, the next two visible reviews are copies of the first ones.
  await carousel.locator('.home-reviews-carousel__clone[data-review-index="0"]').last().locator("button").click();
  await expect(page.getByRole("dialog", { name: "Отзыв клиента 1" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(carousel.locator(".home-reviews__card-button").first()).toBeFocused();
  await expect(carousel.locator(".home-reviews__card-button").first()).toBeInViewport();
});
