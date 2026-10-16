/* global document */
import { expect, test } from "@playwright/test";

test("галерея и следующий блок разделены одним отступом, компактные версии сохраняют масштабирование", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop-chromium", "One complete breakpoint matrix");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const works = page.locator(".home-works");
  await expect(works).toBeAttached();
  for (const expanded of [false, true]) {
    if (expanded) await works.locator(".home-works__more").click();
    for (const width of [320, 390, 639, 640, 820, 1024, 1199, 1200, 1440, 1920, 2560]) {
      await page.setViewportSize({ width, height: 900 });
      const expected = width >= 1200 ? 40 : width >= 640 ? 20 * width / 640 : 50 * width / 320;
      await expect.poll(() => page.evaluate(() => {
        const section = document.querySelector(".home-works");
        const works = section.querySelector(".home-works__surface").getBoundingClientRect();
        // Tablet intentionally places "Клиентам" before reviews.
        const next = section.nextElementSibling.querySelector(".home-section__surface").getBoundingClientRect();
        return next.top - works.bottom;
      }), { message: `${width}px, expanded=${expanded}` }).toBeCloseTo(expected, 0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  }
});
