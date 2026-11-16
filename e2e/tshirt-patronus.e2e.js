import { expect, test } from "@playwright/test";

const prepare = async (page, code, restoredType = "") => {
  await page.route("**/api/**", route => route.abort());
  await page.route("**/api/public-config", route => route.fulfill({ json: { turnstile: { enabled: false } } }));
  await page.addInitScript(({ code, restoredType }) => {
    if (sessionStorage.getItem("its_order_draft_v1") || localStorage.getItem("its_order_draft_v1")) return;
    sessionStorage.setItem("its_order_draft_v1", JSON.stringify({ version: 1, uploadFiles: [], order: {
      clothing: { type: code, color: "Чёрный", size: "M", profile: { code, patronusLimit: code === "tshirt" ? 1 : 4,
        prices: { Patronus: 8500, petFace: 6000 }, carDesignPrices: { simple: 5000, medium: 7000, complex: null } } },
      embroidery: { type: restoredType, typeSelectionExplicit: Boolean(restoredType), patronusCount: 1, price: 8500,
        uploadedImage: [], customOption: { image: false, text: false } }, recipient: {},
    } }));
  }, { code, restoredType });
  await page.goto("/embroidery");
};

test("футболка: старый патронус сбрасывается, другие дизайны доступны на всех адаптивах", async ({ page }, info) => {
  await prepare(page, "tshirt", "Patronus");
  const patronus = page.locator('input[name="embroideryTypeDesktop"][value="Patronus"]');
  const next = page.getByRole("button", { name: "далее", exact: true });
  const price = page.locator(".embroiderySelectorDesktop__price");
  const widths = info.project.name.startsWith("desktop") ? [1440, 820] : [320, 390];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(patronus).toHaveCount(0);
    await expect(page.locator('input[name="embroideryTypeDesktop"]:checked')).toHaveCount(0);
    await expect(price).toHaveCount(0);
    await expect(next).toBeDisabled();
    for (const type of ["Car", "petFace", "custom"]) {
      await expect(page.locator(`input[name="embroideryTypeDesktop"][value="${type}"]`)).toBeEnabled();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  await page.reload();
  await expect(patronus).toHaveCount(0);
  await expect(next).toBeDisabled();
  await page.locator('.embroideryDesktopChoice:has(input[value="petFace"]) .embroideryDesktopChoice__select').click();
  await expect(next).toBeEnabled();
  await expect(price).toContainText(/6\s*000/);
  await page.locator('.embroideryDesktopChoice:has(input[value="Car"]) .embroideryDesktopChoice__select').click();
  await page.locator('input[name="carDesign"][value="simple"]').check();
  await expect(next).toBeEnabled();
  await expect(price).toContainText(/5\s*000/);
  await page.getByRole("button", { name: "надпись", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Текст для вышивки" })).toBeVisible();
});

for (const code of ["hoodie", "svitshot"]) {
  test(`${code}: патронус остаётся доступен`, async ({ page }) => {
    await prepare(page, code);
    await page.locator('.embroideryDesktopChoice:has(input[value="Patronus"]) .embroideryDesktopChoice__select').click();
    await expect(page.locator('input[name="embroideryTypeDesktop"][value="Patronus"]')).toBeChecked();
    await expect(page.getByRole("button", { name: "далее", exact: true })).toBeEnabled();
    await expect(page.locator(".embroiderySelectorDesktop__price")).toContainText(/8\s*500/);
  });
}
