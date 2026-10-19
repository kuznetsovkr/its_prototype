import { expect, test } from "@playwright/test";
test.setTimeout(90_000);

const prices = { tshirt: { simple: 5000, medium: 7000, complex: null }, svitshot: { simple: 6000, medium: 8000, complex: 11000 }, hoodie: { simple: 6500, medium: 8500, complex: 11500 } };
const prepare = async (page, code = "hoodie") => {
  await page.route("**/api/**", route => route.abort());
  await page.route("**/api/public-config", route => route.fulfill({ json: { turnstile: { enabled: false } } }));
  await page.route("**/api/pricing/quote", route => route.fulfill({ json: { prices: { Patronus: 10000, petFace: 8000, Car: prices[code].simple }, carDesignPrices: prices[code], clothingTypeCode: code } }));
  await page.addInitScript(({ code, prices }) => {
    if (sessionStorage.getItem("its_order_draft_v1")) return;
    sessionStorage.setItem("its_order_draft_v1", JSON.stringify({ version: 1, uploadFiles: [], order: {
      clothing: { type: code, color: "Чёрный", size: "M", profile: { code, patronusLimit: 4, carDesignPrices: prices, prices: { Patronus: 10000, petFace: 8000 } }, previewSrc: "/favicon.svg" },
      embroidery: { type: "", typeSelectionExplicit: false, uploadedImage: [] }, recipient: {},
    } }));
  }, { code, prices: prices[code] });
  await page.goto("/embroidery");
  await page.locator('.embroideryDesktopChoice:has(input[value="Car"]) .embroideryDesktopChoice__select').click();
};

for (const code of ["hoodie", "svitshot", "tshirt"]) {
  test(`автомобили ${code}: цены, явный выбор и ограничения`, async ({ page }, info) => {
    await prepare(page, code);
    const total = page.locator(".embroiderySelectorDesktop__price");
    await expect(total).toHaveCount(0);
    await expect(page.getByRole("button", { name: "далее", exact: true })).toBeDisabled();
    for (const [design, amount] of Object.entries(prices[code])) {
      const input = page.locator(`input[name="carDesign"][value="${design}"]`);
      if (amount == null) { await expect(input).toBeDisabled(); continue; }
      await input.check();
      await expect(total).toContainText(new RegExp(String(amount).replace(/(\d)(?=\d{3}$)/, "$1\\s*")));
      await expect(page.getByRole("button", { name: "далее", exact: true })).toBeEnabled();
    }
    const widths = info.project.name.startsWith("desktop") ? [1440, 820, 640] : [320, 390, 428];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 1000 });
      const [cards, panel, navigation] = await Promise.all([page.locator(".carDesignSelector").boundingBox(), page.locator(".embroiderySelectorDesktop__panel").boundingBox(), page.locator(".embroiderySelectorDesktop__navigation").boundingBox()]);
      expect(cards.y + cards.height).toBeLessThanOrEqual(panel.y + panel.height + 1);
      expect(navigation.y).toBeGreaterThanOrEqual(panel.y + panel.height - 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await expect(page.locator(".carDesignSelector img")).toHaveCount(3);
      expect(await page.locator(".carDesignSelector img").evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0))).toBe(true);
    }
    await page.locator(".embroiderySelectorDesktop").screenshot({ path: info.outputPath(`${code}.png`) });
    await page.reload();
    await expect(page.locator('input[name="carDesign"]:checked')).toHaveValue(code === "tshirt" ? "medium" : "complex", { timeout: 20_000 });
    await expect(total).toBeVisible();
    await page.locator('.embroideryDesktopChoice:has(input[value="Car"]) .embroideryDesktopChoice__select').click();
    await expect(total).toHaveCount(0);
  });
}

test("сброс типа удаляет сложность и цену, устаревшая цена не появляется при восстановлении", async ({ page }) => {
  await prepare(page);
  await page.locator('input[name="carDesign"][value="simple"]').check();
  await expect(page.locator(".embroiderySelectorDesktop__price")).toContainText(/6\s*500/);
  await page.locator('.embroideryDesktopChoice:has(input[value="petFace"]) .embroideryDesktopChoice__select').click();
  await page.locator('.embroideryDesktopChoice:has(input[value="Car"]) .embroideryDesktopChoice__select').click();
  await expect(page.locator('input[name="carDesign"]:checked')).toHaveCount(0);
  await expect(page.locator(".embroiderySelectorDesktop__price")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".carDesignSelector")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".embroiderySelectorDesktop__price")).toHaveCount(0);
});
