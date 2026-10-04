import { expect, test } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1440, height: 900, distance: 25 },
  { name: "tablet", width: 1024, height: 768, distance: 25 * 1024 / 640 },
  { name: "mobile", width: 390, height: 844, distance: 10 * 390 / 320 },
  { name: "small-mobile", width: 320, height: 700, distance: 10 },
];

for (const viewport of viewports) {
  test(`собачки движутся в противофазе: ${viewport.name}`, async ({ page }, testInfo) => {
    test.skip(
      viewport.name.includes("mobile")
        ? testInfo.project.name !== "mobile-chromium"
        : testInfo.project.name !== "desktop-chromium",
      "Проверяем ширину в соответствующем браузерном режиме",
    );

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");

    const questions = page.locator(".home-questions");
    const dogs = questions.locator(".home-questions__dog--1-picture, .home-questions__dog--2-picture");
    await expect(dogs).toHaveCount(2);
    await expect(dogs.first()).toHaveCSS("animation-name", "home-questions-dog-float");
    await expect(dogs.first()).toHaveCSS("animation-duration", "2s");
    await expect(dogs.nth(1)).toHaveCSS("animation-delay", "-1s");

    const positions = await dogs.evaluateAll((elements) => {
      const animations = elements.map((element) => element.getAnimations()[0]);
      const getY = (element) => Number.parseFloat(getComputedStyle(element).translate.split(" ").at(-1));
      animations.forEach((animation) => {
        animation.pause();
        animation.currentTime = 0;
      });
      const start = elements.map(getY);
      animations.forEach((animation) => { animation.currentTime = 1000; });
      const midpoint = elements.map(getY);
      return { start, midpoint };
    });

    expect(positions.start[0]).toBeCloseTo(-viewport.distance, 0);
    expect(positions.start[1]).toBeCloseTo(viewport.distance, 0);
    expect(positions.midpoint[0]).toBeCloseTo(viewport.distance, 0);
    expect(positions.midpoint[1]).toBeCloseTo(-viewport.distance, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  });
}

test("при уменьшенном движении собачки остаются на месте", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Достаточно проверить настройку в одном браузере");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const dogs = page.locator(".home-questions__dog--1-picture, .home-questions__dog--2-picture");
  await expect(dogs).toHaveCount(2);
  await expect(dogs.first()).toHaveCSS("animation-name", "none");
  await expect(dogs.nth(1)).toHaveCSS("animation-name", "none");
  expect(await dogs.evaluateAll((elements) => elements.every((element) => element.getAnimations().length === 0)))
    .toBe(true);
});
