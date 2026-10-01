import { expect, test } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 1024, height: 768 },
  { name: "mobile", width: 390, height: 844 },
];

for (const viewport of viewports) {
  test(`ответ FAQ плавно появляется и сохраняет высоту: ${viewport.name}`, async ({ page }, testInfo) => {
    test.skip(
      viewport.name === "mobile"
        ? testInfo.project.name !== "mobile-chromium"
        : testInfo.project.name !== "desktop-chromium",
      "Проверяем ширину в соответствующем браузерном режиме",
    );

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");

    const faq = page.locator(".home-faq");
    const triggers = faq.locator(".home-accordion__trigger");
    const panels = faq.locator(".home-accordion__panel");
    await expect(triggers).toHaveCount(6);
    await expect(triggers.first()).toHaveAttribute("aria-expanded", "true");
    await expect(panels.first()).toBeVisible();
    await expect(panels.nth(1)).toBeHidden();

    await triggers.nth(1).click();
    await expect(triggers.first()).toHaveAttribute("aria-expanded", "false");
    await expect(triggers.nth(1)).toHaveAttribute("aria-expanded", "true");
    await expect(panels.first()).toBeHidden();
    await expect(panels.nth(1)).toBeVisible();
    await expect(panels.nth(1)).toHaveCSS("animation-name", "home-faq-panel-enter");
    await expect(panels.nth(1)).toHaveCSS("animation-duration", "0.5s");
    await expect(panels.nth(1)).toHaveCSS("opacity", "1");

    const panelFitsContent = await panels.nth(1).evaluate((panel) =>
      panel.clientHeight + 1 >= panel.scrollHeight);
    expect(panelFitsContent).toBe(true);

    await triggers.nth(2).focus();
    await page.keyboard.press("Enter");
    await expect(triggers.nth(2)).toHaveAttribute("aria-expanded", "true");
    await expect(panels.nth(1)).toBeHidden();
    await expect(panels.nth(2)).toBeVisible();
    await expect(panels.nth(2)).toHaveCSS("animation-name", "home-faq-panel-enter");

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  });
}

test("при уменьшенном движении ответы открываются без анимации", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Достаточно проверить настройку в одном браузере");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const faq = page.locator(".home-faq");
  await faq.locator(".home-accordion__trigger").nth(1).click();
  const panel = faq.locator(".home-accordion__panel").nth(1);
  await expect(panel).toBeVisible();
  await expect(panel).toHaveCSS("animation-name", "none");
  await expect(panel).toHaveCSS("opacity", "1");
});
