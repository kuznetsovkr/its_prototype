import { expect, test } from "@playwright/test";

test.setTimeout(90_000);

const viewports = [
  { name: "desktop", width: 1440, height: 900, distance: 560, fifthStart: 0.67 },
  { name: "tablet", width: 1024, height: 768, distance: 448, fifthStart: 0.67 },
  { name: "mobile", width: 390, height: 844, distance: 336, fifthStart: 0.8 },
];

const scrollCardToProgress = async (page, index, offset) => {
  await page.evaluate(({ cardIndex, scrollOffset }) => {
    const section = document.querySelector(".home-works");
    const card = document.querySelectorAll(".home-works__item")[cardIndex];
    let layoutTop = section.getBoundingClientRect().top + window.scrollY;
    let element = card;
    while (element && element !== section) {
      layoutTop += element.offsetTop;
      element = element.offsetParent;
    }
    window.scrollTo({ top: layoutTop - window.innerHeight + scrollOffset, behavior: "instant" });
  }, { cardIndex: index, scrollOffset: offset });
};

const readScale = (locator) => locator.evaluate((element) => Number(getComputedStyle(element).scale));

for (const viewport of viewports) {
  test(`карточки работ увеличиваются с разным ритмом: ${viewport.name}`, async ({ page }, testInfo) => {
    test.skip(
      viewport.name === "mobile"
        ? testInfo.project.name !== "mobile-chromium"
        : testInfo.project.name !== "desktop-chromium",
      "Проверяем ширину в соответствующем браузерном режиме",
    );

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");
    const works = page.locator(".home-works");
    const first = works.locator(".home-works__item").first();
    const fifth = works.locator(".home-works__item").nth(4);
    await expect(first).toBeAttached();

    await scrollCardToProgress(page, 0, 0);
    await expect.poll(() => readScale(first)).toBeCloseTo(0.9, 2);

    await scrollCardToProgress(page, 0, viewport.distance / 2);
    await expect.poll(() => readScale(first)).toBeCloseTo(0.95, 2);

    await scrollCardToProgress(page, 0, viewport.distance);
    await expect.poll(() => readScale(first)).toBeCloseTo(1, 2);

    await scrollCardToProgress(page, 4, 0);
    await expect.poll(() => readScale(fifth)).toBeCloseTo(viewport.fifthStart, 2);

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  });
}

test("дополнительные работы сохраняют анимацию раскрытия", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Достаточно проверить раскрытие на десктопе");
  await page.goto("/");
  const works = page.locator(".home-works");
  await works.locator(".home-works__more").click();
  const additional = works.locator(".home-works__item--additional");
  await expect(additional).toHaveCount(9);
  await expect(additional.first()).toHaveCSS("animation-name", "home-work-reveal");
  expect(await readScale(additional.first())).toBeGreaterThanOrEqual(0.9);
});

test("при уменьшенном движении карточки остаются полного размера", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Достаточно проверить настройку в одном браузере");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const first = page.locator(".home-works__item").first();
  await expect(first).toBeAttached();
  await scrollCardToProgress(page, 0, 0);
  await expect.poll(() => readScale(first)).toBe(1);
});
