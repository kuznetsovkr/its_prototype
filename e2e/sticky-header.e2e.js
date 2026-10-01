import { expect, test } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1440, height: 900, stickyTop: 70 },
  { name: "tablet", width: 1024, height: 768, stickyTop: 20 },
  { name: "mobile", width: 390, height: 844, stickyTop: 0 },
];

for (const viewport of viewports) {
  test(`шапка остаётся доступной при прокрутке главной: ${viewport.name}`, async ({ page }, testInfo) => {
    test.skip(
      viewport.name === "mobile"
        ? testInfo.project.name !== "mobile-chromium"
        : testInfo.project.name !== "desktop-chromium",
      "Проверяем ширину в соответствующем браузерном режиме",
    );

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");

    const header = page.locator(".home-header");
    const initialTop = (await header.boundingBox()).y;
    expect(initialTop).toBeCloseTo(viewport.stickyTop, 0);

    await page.evaluate(() => window.scrollTo(0, 1400));
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
    await expect.poll(async () => (await header.boundingBox()).y).toBeCloseTo(viewport.stickyTop, 0);
    await expect(header).toBeInViewport();
    await expect(header).toHaveClass(/home-header--scrolled/);

    if (viewport.name === "mobile") {
      await header.getByRole("button", { name: "Открыть меню" }).click();
      await expect(page.getByRole("dialog", { name: "Мобильное меню" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog", { name: "Мобильное меню" })).toBeHidden();
      await header.getByRole("button", { name: "Открыть меню" }).click();
      await header.locator(".home-header__mobile-link--about").click();
      const sectionTop = (await page.locator("#about").boundingBox()).y;
      const headerBottom = (await header.boundingBox()).y + (await header.boundingBox()).height;
      expect(sectionTop).toBeGreaterThanOrEqual(headerBottom);
    } else {
      await header.locator(".home-header__link--about").click();
      const sectionTop = (await page.locator("#about").boundingBox()).y;
      const headerBottom = (await header.boundingBox()).y + (await header.boundingBox()).height;
      expect(sectionTop).toBeGreaterThanOrEqual(headerBottom);
    }
  });
}

test("шапка внутренней страницы сохраняет место в потоке и прилипает при прокрутке", async ({ page }, testInfo) => {
  await page.goto("/certificate");

  const header = page.locator(".home-header--standalone");
  const initialTop = (await header.boundingBox()).y;
  const stickyTop = testInfo.project.name === "mobile-chromium" ? 0 : 10;
  if (stickyTop === 0) {
    expect(initialTop).toBe(0);
  } else {
    expect(initialTop).toBeGreaterThan(stickyTop);
  }

  await page.evaluate(() => window.scrollTo(0, 800));
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  await expect.poll(async () => (await header.boundingBox()).y).toBeCloseTo(stickyTop, 0);
  await expect(header).toBeInViewport();
});
