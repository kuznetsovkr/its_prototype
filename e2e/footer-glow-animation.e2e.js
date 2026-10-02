import { expect, test } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 1024, height: 768 },
  { name: "mobile", width: 390, height: 844 },
  { name: "small-mobile", width: 320, height: 700 },
];

for (const viewport of viewports) {
  test(`свечение футера плавно увеличивается и уменьшается: ${viewport.name}`, async ({ page }, testInfo) => {
    test.skip(
      viewport.name.includes("mobile")
        ? testInfo.project.name !== "mobile-chromium"
        : testInfo.project.name !== "desktop-chromium",
      "Проверяем ширину в соответствующем браузерном режиме",
    );

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");

    const footer = page.locator(".home-footer");
    const glow = footer.locator(".home-footer__glow");
    await expect(glow).toHaveCount(1, { timeout: 15_000 });
    await expect(glow).toHaveCSS("animation-name", "home-footer-glow-pulse");
    await expect(glow).toHaveCSS("animation-duration", "2s");
    await expect(glow).toHaveCSS("animation-iteration-count", "infinite");

    const frames = await glow.evaluate((element) => {
      const animation = element.getAnimations()[0];
      animation.pause();
      return [0, 1000, 2000].map((time) => {
        animation.currentTime = time;
        const style = getComputedStyle(element);
        const bounds = element.getBoundingClientRect();
        return {
          scale: Number(style.scale),
          opacity: Number(style.opacity),
          centerX: bounds.left + bounds.width / 2,
          centerY: bounds.top + bounds.height / 2,
        };
      });
    });

    expect(frames[0].scale).toBeCloseTo(0.92, 2);
    expect(frames[1].scale).toBeCloseTo(1.08, 2);
    expect(frames[2].scale).toBeCloseTo(0.92, 2);
    expect(frames[0].opacity).toBeCloseTo(0.65, 2);
    expect(frames[1].opacity).toBeCloseTo(1, 2);
    expect(frames[2].opacity).toBeCloseTo(0.65, 2);
    expect(frames[1].centerX).toBeCloseTo(frames[0].centerX, 1);
    expect(frames[1].centerY).toBeCloseTo(frames[0].centerY, 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  });
}

test("orange footer glow is centered on the illustration without changing the dark footer", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Desktop and tablet widths are checked in Chromium");

  for (const width of [1440, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    await expect(page.locator(".home-footer__glow")).toHaveCSS("filter", "brightness(0) invert(1)");

    const offset = await page.locator(".home-footer").evaluate((footer) => {
      const glow = footer.querySelector(".home-footer__glow-picture").getBoundingClientRect();
      const illustration = footer.querySelector(".home-footer__illustration-picture").getBoundingClientRect();
      return Math.abs(glow.top + glow.height / 2 - illustration.top - illustration.height / 2);
    });
    expect(offset).toBeLessThan(20);

    await page.goto("/certificate");
    await expect(page.locator(".home-footer__glow")).toHaveCSS("filter", "none");
  }
});

test("при уменьшенном движении свечение статично на главной и внутренних страницах", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Достаточно проверить настройку в одном браузере");
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const route of ["/", "/certificate"]) {
    await page.goto(route);
    const glow = page.locator(".home-footer__glow");
    await expect(glow).toHaveCSS("animation-name", "none");
    await expect(glow).toHaveCSS("scale", "1");
    await expect(glow).toHaveCSS("opacity", "1");
  }
});
