import { expect, test } from "@playwright/test";

test.setTimeout(60_000);

test("десктопные hover-эффекты и ссылки авторов", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Hover мышью на десктопе");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const header = page.locator(".home-header__link--certificate");
  await header.hover();
  await expect(header).toHaveCSS("background-color", "rgb(188, 88, 35)");
  await expect(header).toHaveCSS("transition-duration", "0.3s, 0.3s");
  const order = page.locator(".home-about .home-button--accent");
  await page.locator(".home-about").evaluate(element => window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 150, behavior: "instant" }));
  await expect.poll(() => page.locator(".home-about").evaluate(element => Number(element.style.getPropertyValue("--home-scroll-zoom-scale")))).toBe(1);
  await order.hover();
  await expect(order).toHaveCSS("background-color", "rgb(12, 12, 12)");
  const faq = page.locator(".home-accordion__trigger").first();
  await page.locator(".home-faq").evaluate(element => window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 150, behavior: "instant" }));
  await expect.poll(() => page.locator(".home-faq").evaluate(element => Number(element.style.getPropertyValue("--home-scroll-zoom-scale")))).toBe(1);
  await faq.hover();
  await expect(faq).toHaveCSS("background-color", "rgb(188, 88, 35)");
  const design = page.locator(".home-footer__legal-design");
  const development = page.locator(".home-footer__legal-development");
  await expect(design).toHaveAttribute("href", "https://t.me/tommyravana");
  await expect(development).toHaveAttribute("href", "https://t.me/krkuznetsov");
  await design.hover();
  await expect(design).toHaveCSS("opacity", "0.7");
  await expect(design).toHaveCSS("scale", "0.95");
  await development.focus();
  await expect(development).toBeFocused();
  await expect(development).toHaveCSS("outline-style", "solid");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await design.hover();
  await expect(design).toHaveCSS("scale", "none");
  expect(await design.evaluate(element => parseFloat(getComputedStyle(element).transitionDuration))).toBeLessThan(0.001);
});

for (const width of [320, 390, 768, 1024, 1200, 1440, 2560]) {
  test(`косметические правки не создают горизонтальный скролл: ${width}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== (width < 768 ? "mobile-chromium" : "desktop-chromium"), "Соответствующий режим ввода");
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.locator(".home-footer__legal-design").scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    for (const credit of [".home-footer__legal-design", ".home-footer__legal-development"]) {
      const box = await page.locator(credit).boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
    const images = await page.locator(".home-process__image").evaluateAll(async (items) => {
      await Promise.all(items.map(image => image.decode()));
      return items.map(image => ({ src: image.currentSrc, fit: getComputedStyle(image).objectFit, width: image.naturalWidth }));
    });
    for (const image of images) {
      expect(image.src).toContain("-clean-");
      expect(image.fit).toBe("cover");
      expect(image.width).toBeGreaterThan(0);
    }
    if (width >= 1200) {
      const reviews = page.locator(".home-reviews");
      await reviews.evaluate(element => window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 150, behavior: "instant" }));
      await expect.poll(() => reviews.evaluate(element => Number(element.style.getPropertyValue("--home-scroll-zoom-scale")))).toBe(1);
      await reviews.getByRole("button", { name: "Предыдущие отзывы" }).click();
      await expect(reviews.locator(".home-reviews-carousel__viewport")).toHaveAttribute("data-active-index", "5");
    }
  });
}
