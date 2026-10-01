import { expect, test } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 1024, height: 768 },
  { name: "mobile", width: 390, height: 844 },
];

for (const viewport of viewports) {
  test(`вкладки «Клиентам» появляются снизу и остаются по центру: ${viewport.name}`, async ({ page }, testInfo) => {
    test.skip(
      viewport.name === "mobile"
        ? testInfo.project.name !== "mobile-chromium"
        : testInfo.project.name !== "desktop-chromium",
      "Проверяем ширину в соответствующем браузерном режиме",
    );

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");

    const customers = page.locator(".home-customers");
    const tabs = customers.getByRole("tab");
    const panels = customers.getByRole("tabpanel", { includeHidden: true });
    await expect(tabs).toHaveCount(5);
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
    await expect(panels.first().locator(".home-customers__content")).toBeVisible();
    await expect(panels.nth(1)).toBeHidden();

    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(panels.first()).toBeHidden();
    await expect(panels.nth(1).locator(".home-customers__content")).toBeVisible();
    await expect(panels.nth(1)).toContainText("Доставка:");
    const content = panels.nth(1).locator(".home-customers__content");
    await expect(content).toHaveCSS("animation-name", "home-customers-content-enter");
    await expect(content).toHaveCSS("animation-duration", "0.5s");
    await expect(content).toHaveCSS("opacity", "1");

    await tabs.nth(1).focus();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
    await expect(panels.nth(2)).toContainText("Уход:");
    await expect(panels.nth(2).locator(".home-customers__content"))
      .toHaveCSS("animation-name", "home-customers-content-enter");

    await page.keyboard.press("ArrowLeft");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(content).toBeVisible();
    await expect(content).toHaveCSS("animation-name", "home-customers-content-enter");
    await expect(content).toHaveCSS("opacity", "1");

    if (viewport.name === "mobile") {
      const box = await content.boundingBox();
      expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThan(2);
    }

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  });
}

test("при уменьшенном движении вкладка появляется сразу", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Достаточно проверить настройку в одном браузере");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const customers = page.locator(".home-customers");
  await customers.getByRole("tab").nth(1).click();
  const content = customers.getByRole("tabpanel").locator(".home-customers__content");
  await expect(content).toHaveCSS("animation-name", "none");
  await expect(content).toHaveCSS("opacity", "1");
});
