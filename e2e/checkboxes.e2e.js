import { test, expect } from "@playwright/test";

test("все чекбоксы показывают белую галочку на оранжевом фоне", async ({ page }) => {
  await page.goto("/recipient");
  await expect(page.locator('.recipientOrderForm__consent input')).toBeVisible();
  const checkboxes = page.locator('input[type="checkbox"]');
  expect(await checkboxes.count()).toBeGreaterThanOrEqual(3);
  for (const input of await checkboxes.all()) {
    // The manual-delivery checkbox is inside the initially hidden CDEK dialog.
    await input.evaluate((element) => { element.checked = true; });
    const checked = await input.evaluate((element) => {
      const style = getComputedStyle(element);
      return { color: style.backgroundColor, icon: style.backgroundImage, content: getComputedStyle(element, "::before").content };
    });
    expect(checked.color).toBe("rgb(188, 88, 35)");
    expect(checked.icon).toMatch(/checkbox-check|data:image\/svg/);
    expect(["none", "normal"]).toContain(checked.content);
    await input.evaluate((element) => { element.checked = false; });
    expect(await input.evaluate((element) => getComputedStyle(element).backgroundImage)).toBe("none");
  }
  const consent = page.locator('.recipientOrderForm__consent input');
  await consent.focus();
  await page.keyboard.press("Space");
  await expect(consent).toBeChecked();
});
