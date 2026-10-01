import { expect, test } from "@playwright/test";

test.setTimeout(90_000);

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 1024, height: 768 },
  { name: "mobile", width: 390, height: 844 },
];

const sections = [
  { selector: ".home-about", layers: [".home-about__surface", ".home-about__card", ".home-about__photo"] },
  { selector: ".home-process", layers: [".home-process__inner", ".home-process__visual"] },
  { selector: ".home-works", layers: [".home-works__surface", ".home-works__inner"] },
  { selector: ".home-reviews", layers: [".home-reviews__surface", ".home-reviews__inner"] },
  { selector: ".home-customers", layers: [".home-customers__surface", ".home-customers__inner", ".home-customers__photo"] },
  { selector: ".home-faq", layers: [".home-faq__surface", ".home-faq__inner"] },
  { selector: ".home-questions", layers: [".home-questions__surface", ".home-questions__card"] },
  { selector: ".home-social", layers: [".home-social__surface", ".home-social__inner", ".home-social__item"] },
];

const scrollToProgress = async (page, selector, offset) => {
  await page.locator(selector).waitFor({ state: "attached" });
  await page.evaluate(({ sectionSelector, scrollOffset }) => {
    const section = document.querySelector(sectionSelector);
    const top = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top - window.innerHeight + scrollOffset, behavior: "instant" });
  }, { sectionSelector: selector, scrollOffset: offset });
};

const readScale = (locator) => locator.evaluate((element) => Number(getComputedStyle(element).scale));

for (const viewport of viewports) {
  test(`подложки и внутренние блоки увеличиваются вместе: ${viewport.name}`, async ({ page }, testInfo) => {
    test.skip(
      viewport.name === "mobile"
        ? testInfo.project.name !== "mobile-chromium"
        : testInfo.project.name !== "desktop-chromium",
      "Проверяем ширину в соответствующем браузерном режиме",
    );

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");

    for (const { selector, layers } of sections) {
      await scrollToProgress(page, selector, 0);
      const section = page.locator(selector);
      await expect.poll(() => section.evaluate((element) => {
        const progress = Math.min(1, Math.max(0, (window.innerHeight - element.getBoundingClientRect().top) / 560));
        const scale = Number(element.style.getPropertyValue("--home-scroll-zoom-scale"));
        return Math.abs(scale - (0.8 + 0.2 * progress));
      })).toBeLessThan(0.01);

      for (const layer of layers) {
        await expect.poll(() => readScale(section.locator(layer).first())).toBeGreaterThanOrEqual(0.8);
      }

      if (viewport.name === "mobile" && selector === ".home-about") {
        for (const layer of layers) {
          await expect.poll(() => readScale(section.locator(layer).first())).toBe(1);
        }
      }

      await scrollToProgress(page, selector, 560);
      for (const layer of layers) {
        await expect.poll(() => readScale(section.locator(layer).first())).toBeCloseTo(1, 2);
      }
    }

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  });
}

test("при уменьшенном движении секции остаются полного размера", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Достаточно проверить настройку в одном браузере");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  for (const { selector, layers } of sections) {
    await scrollToProgress(page, selector, 0);
    const section = page.locator(selector);
    for (const layer of layers) {
      await expect.poll(() => readScale(section.locator(layer).first())).toBe(1);
    }
  }
});
