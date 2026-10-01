import { expect, test } from "@playwright/test";

const denominations = [
  1000, 2000, 3000, 4000, 5000, 6000, 8000,
  10000, 12000, 14000, 16000, 18000, 20000,
];

test("сертификат предлагает согласованные номиналы и обновляет сумму", async ({ page }, testInfo) => {
  await page.goto("/certificate");

  const select = page.getByRole("combobox", { name: "Номинал" });
  const amount = page.locator(".certificatePage__amount");
  const action = page.getByRole("button", { name: "Подарить сертификат" });

  await expect(select).toHaveValue("1000");
  await expect(amount).toHaveText(/1\s*000 ₽/);
  expect(await select.locator("option").evaluateAll((options) =>
    options.map((option) => Number(option.value)))).toEqual(denominations);

  await select.selectOption("2000");
  await expect(amount).toHaveText(/2\s*000 ₽/);
  await select.selectOption("20000");
  await expect(amount).toHaveText(/20\s*000 ₽/);
  await expect(action).toBeDisabled();

  if (testInfo.project.name === "desktop-chromium") {
    await page.setViewportSize({ width: 820, height: 1180 });
  }
  const selectBox = await select.boundingBox();
  const actionBox = await action.boundingBox();
  expect(selectBox.y + selectBox.height).toBeLessThan(actionBox.y);
  if (testInfo.project.name === "mobile-chromium") {
    expect(await select.evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
  }
});
