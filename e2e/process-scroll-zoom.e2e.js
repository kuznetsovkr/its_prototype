import { expect, test } from "@playwright/test";

test.setTimeout(90_000);

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 1024, height: 768 },
  { name: "mobile", width: 390, height: 844 },
];

const scrollToProgress = async (page, distance) => {
  await page.evaluate((offset) => {
    const section = document.querySelector(".home-process");
    const top = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top - window.innerHeight + offset, behavior: "instant" });
  }, distance);
};

const readScale = (page) => page.locator(".home-process__surface").evaluate((element) =>
  Number(new DOMMatrixReadOnly(getComputedStyle(element).transform).a));

for (const viewport of viewports) {
  test(`блок «Процесс» плавно увеличивается за 560 px прокрутки: ${viewport.name}`, async ({ page }, testInfo) => {
    test.skip(
      viewport.name === "mobile"
        ? testInfo.project.name !== "mobile-chromium"
        : testInfo.project.name !== "desktop-chromium",
      "Проверяем ширину в соответствующем браузерном режиме",
    );

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");
    const section = page.locator(".home-process");
    await expect(section).toBeAttached();
    const originalHeight = await section.evaluate((element) => element.offsetHeight);

    await scrollToProgress(page, 0);
    await expect.poll(() => readScale(page)).toBeCloseTo(0.8, 2);

    await scrollToProgress(page, 280);
    await expect.poll(() => readScale(page)).toBeCloseTo(0.9, 2);

    await scrollToProgress(page, 560);
    await expect.poll(() => readScale(page)).toBeCloseTo(1, 2);

    await scrollToProgress(page, 0);
    await expect.poll(() => readScale(page)).toBeCloseTo(0.8, 2);

    expect(await section.evaluate((element) => element.offsetHeight)).toBe(originalHeight);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  });
}

test("при уменьшенном движении блок «Процесс» не масштабируется", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".home-process")).toBeAttached();
  await scrollToProgress(page, 0);
  await expect.poll(() => readScale(page)).toBe(1);
  await scrollToProgress(page, 280);
  await expect.poll(() => readScale(page)).toBe(1);
});
