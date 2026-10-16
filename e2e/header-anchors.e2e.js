/* global window, document */
import { test, expect } from "@playwright/test";

test.setTimeout(90_000);
const expectAnchor = async (page, id) => {
  await expect(page).toHaveURL(new RegExp(`/#${id}$`));
  await expect.poll(() => page.evaluate((targetId) => {
    const target = document.getElementById(targetId);
    if (!target) return Infinity;
    const header = document.querySelector(".home-header");
    const offset = targetId === "top" ? 0 : header.getBoundingClientRect().bottom + 16;
    const expected = Math.min(document.documentElement.scrollHeight - window.innerHeight,
      Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset));
    return Math.abs(window.scrollY - expected);
  }, id), { timeout: 15_000 }).toBeLessThanOrEqual(2);
};

test("шапка и бургер переходят к разделам главной без перезагрузки", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.locator(".home-header__logo")).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => { window.__anchorNavigationProbe = "preserved"; });
  const mobile = Boolean(info.project.use.isMobile);
  const sections = mobile ? ["about", "reviews", "customers", "faq", "works", "contacts"] : ["about", "customers", "contacts"];
  for (const id of sections) {
    if (mobile) await page.getByRole("button", { name: "Открыть меню", exact: true }).click();
    await page.locator(mobile ? `.home-header__mobile-link--${id}` : `.home-header__link--${id}`).click();
    if (mobile) {
      await expect(page.locator(".home-header__menu")).not.toHaveClass(/is-open/);
      await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
    }
    await expectAnchor(page, id);
    expect(await page.evaluate(() => window.__anchorNavigationProbe)).toBe("preserved");
  }
  await page.locator(".home-header__logo").click();
  await expectAnchor(page, "top");
});

test("переход с внутренней страницы и прямой URL открывают нужный раздел", async ({ page }, info) => {
  await page.goto("/certificate");
  await expect(page.locator(".home-header__logo")).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => { window.__anchorNavigationProbe = "preserved"; });
  if (info.project.use.isMobile) await page.getByRole("button", { name: "Открыть меню", exact: true }).click();
  await page.locator(info.project.use.isMobile ? ".home-header__mobile-link--about" : ".home-header__link--about").click();
  await expectAnchor(page, "about");
  expect(await page.evaluate(() => window.__anchorNavigationProbe)).toBe("preserved");
  await page.goto("/#customers");
  await expectAnchor(page, "customers");
  await page.reload();
  await expectAnchor(page, "customers");
});
