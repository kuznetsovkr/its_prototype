/* global document, getComputedStyle, window -- Playwright browser callbacks */
import { expect, test } from "@playwright/test";

test.setTimeout(90_000);

const openHome = async (page, width, height = 900) => {
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  // Wait for the lazy route, including a cold WebKit context, before measuring it.
  await expect(page.locator(".home-about__card")).toBeVisible({ timeout: 15_000 });
  await page.evaluate(() => document.fonts.ready);
};

const readGeometry = (page, selectors) => page.evaluate((list) => list.map((selector) => {
  const element = document.querySelector(selector);
  const bounds = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return { selector, width: bounds.width, height: bounds.height, fontSize: Number.parseFloat(style.fontSize) };
}), selectors);

const commonSelectors = [
  ".home-header", ".home-header__logo", ".home-hero", ".home-hero__title", ".home-hero__order",
  ".home-about__card", ".home-about__photo", ".home-about__order",
  ".home-process__surface", ".home-process__visual", ".home-process__number",
  ".home-works__grid", ".home-works__item--1", ".home-works__actions .home-button",
  ".home-reviews-carousel__viewport", ".home-reviews-carousel__item",
  ".home-tabs__tab", ".home-customers__content", ".home-customers__photo",
  ".home-accordion__trigger", ".home-questions__card", ".home-questions__dog--1-picture",
  ".home-social__item", ".home-social__actions .home-button",
  ".home-footer", ".home-footer__panel", ".home-footer__glow", ".home-footer__illustration-picture",
  ".home-footer__navigation", ".home-footer__social-link", ".home-footer__logo-picture",
];

for (const { name, base, widths } of [
  { name: "mobile", base: 320, widths: [320, 360, 390, 430, 639] },
  { name: "tablet", base: 640, widths: [640, 768, 820, 1024, 1199] },
]) {
  test(`compact autoscale: all ${name} sections use the same proportions`, async ({ page }, testInfo) => {
    test.skip(Boolean(testInfo.project.use.isMobile), "Check the full width matrix once");
    await openHome(page, base);
    const baseline = await readGeometry(page, commonSelectors);

    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      const factor = width / base;
      await expect.poll(async () => (await page.locator(".home-hero").boundingBox()).height)
        .toBeCloseTo((name === "mobile" ? 601 : 380) * factor, 0);
      const actual = await readGeometry(page, commonSelectors);
      for (const [index, item] of actual.entries()) {
        const original = baseline[index];
        expect(item.width, `${width}px ${item.selector} width`).toBeCloseTo(original.width * factor, 0);
        expect(item.height, `${width}px ${item.selector} height`).toBeCloseTo(original.height * factor, 0);
      }

      const textSelectors = [".home-about__text", ".home-about__order", ".home-accordion__content", ".home-footer__copyright"];
      const fontSizes = await readGeometry(page, textSelectors);
      const expectedBaseSizes = name === "mobile" ? [11, 12, 11, 8] : [8, 12, 10, 8];
      fontSizes.forEach((item, index) => {
        expect(item.fontSize, `${width}px ${item.selector} font`).toBeCloseTo(expectedBaseSizes[index] * factor, 2);
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  });
}

test("compact autoscale switches layouts at the existing boundaries without a reload", async ({ page }, testInfo) => {
  test.skip(Boolean(testInfo.project.use.isMobile), "Check the width boundaries once");
  await openHome(page, 390);
  for (const [width, mode, heroHeight, headerPosition, footerHeight] of [
    [639, "mobile", 601 * 639 / 320, "sticky", 958 * 639 / 320],
    [640, "tablet", 380, "fixed", 796],
    [1199, "tablet", 380 * 1199 / 640, "fixed", 796 * 1199 / 640],
    [1200, "desktop", 700, "fixed", 803],
    [2560, "desktop", 700, "fixed", 803],
    [320, "mobile", 601, "sticky", 958],
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator(".home-page")).toHaveClass(`home-page home-page--${mode}`);
    await expect.poll(async () => (await page.locator(".home-hero").boundingBox()).height).toBeCloseTo(heroHeight, 0);
    await expect(page.locator(".home-header")).toHaveCSS("position", headerPosition);
    await expect.poll(async () => (await page.locator(".home-footer").boundingBox()).height).toBeCloseTo(footerHeight, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});

test("autoscaled works and FAQ keep dynamic content inside their surfaces", async ({ page }, testInfo) => {
  test.skip(Boolean(testInfo.project.use.isMobile), "Check mobile and tablet widths once");
  for (const width of [390, 639, 640, 1024, 1199]) {
    await openHome(page, width);
    await page.locator(".home-works__actions").getByRole("button", { name: /ещ[её] примеры/i }).click();
    const works = page.locator(".home-works");
    await expect(works).toHaveClass(/is-expanded/);
    const worksFit = await works.evaluate((section) => {
      const surface = section.querySelector(".home-works__surface").getBoundingClientRect();
      const grid = section.querySelector(".home-works__grid").getBoundingClientRect();
      const actions = section.querySelector(".home-works__actions").getBoundingClientRect();
      return grid.left >= surface.left - 1 && grid.right <= surface.right + 1
        && grid.bottom <= actions.top + 1 && actions.bottom <= surface.bottom + 1;
    });
    expect(worksFit, `expanded works fit at ${width}px`).toBe(true);
    const triggers = page.locator(".home-accordion__trigger");
    for (let index = 0; index < await triggers.count(); index += 1) {
      if (await triggers.nth(index).getAttribute("aria-expanded") !== "true") await triggers.nth(index).click();
      const panel = page.locator(".home-accordion__panel").nth(index);
      await expect(panel).toBeVisible();
      expect(await panel.evaluate((element) => element.scrollHeight <= element.clientHeight + 1)).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});

test("the scaled mobile menu locks scrolling, fits the viewport and restores focus", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.isMobile, "Use the touch browser for mobile interactions");
  await openHome(page, 430, 740);
  await page.evaluate(() => window.scrollTo(0, 1200));
  const trigger = page.locator(".home-header__burger");
  await trigger.click();
  const menu = page.getByRole("dialog", { name: "Мобильное меню" });
  await expect(menu).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  const bounds = await menu.boundingBox();
  expect(bounds.x).toBeCloseTo(0, 0);
  expect(bounds.y).toBeCloseTo(0, 0);
  expect(bounds.width).toBeCloseTo(430, 0);
  expect(bounds.height).toBeCloseTo(740, 0);
  const panel = menu.locator(".home-header__menu-panel");
  expect((await panel.boundingBox()).width).toBeCloseTo(260 * 430 / 320, 0);
  await expect(menu.locator(".home-header__menu-logo")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(menu.locator(".home-header__menu-dismiss")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await menu.locator(".home-header__mobile-order").scrollIntoViewIfNeeded();
  await expect(menu.locator(".home-header__mobile-order")).toBeInViewport();
  await menu.locator(".home-header__menu-dismiss").click({ position: { x: 5, y: 100 } });
  await expect(menu).toBeHidden();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("scaled review cards keep native horizontal gestures and unscaled modal coordinates", async ({ page, browserName }, testInfo) => {
  test.skip(!testInfo.project.use.isMobile, "Use the touch browser for mobile interactions");
  test.skip(browserName !== "chromium", "Touch swipes use Chromium CDP; WebKit modal rotation is checked separately");
  await openHome(page, 390, 844);
  const viewport = page.locator(".home-reviews-carousel__viewport");
  await viewport.scrollIntoViewIfNeeded();
  const boundsBeforeSwipe = await viewport.boundingBox();
  const session = await page.context().newCDPSession(page);
  const y = boundsBeforeSwipe.y + boundsBeforeSwipe.height / 2;
  const startX = boundsBeforeSwipe.x + boundsBeforeSwipe.width - 30;
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: startX, y }] });
  for (let step = 1; step <= 8; step += 1) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove", touchPoints: [{ x: startX - step * 30, y }],
    });
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await session.detach();
  await expect.poll(() => viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(100);
  await viewport.evaluate((element) => element.scrollTo({ left: 0, behavior: "instant" }));
  const card = page.locator(".home-reviews__card-button").first();
  await card.click();
  const dialog = page.getByRole("dialog", { name: "Отзыв клиента 1" });
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(391);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(845);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(card).toBeFocused();
});

test("shared header, footer and constructor scale together on internal routes", async ({ page }, testInfo) => {
  test.skip(Boolean(testInfo.project.use.isMobile), "Check both compact ranges once");
  for (const [width, mode, headerHeight, footerHeight, orderWidth] of [
    [390, "mobile", 66 * 390 / 320, 958 * 390 / 320, 390],
    [1024, "tablet", 24 * 1024 / 640, 796 * 1024 / 640, 1024],
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/order");
    const header = page.locator(".home-header--standalone");
    await expect(header).toHaveCSS("position", "relative");
    await expect.poll(async () => (await header.boundingBox()).height).toBeCloseTo(headerHeight, 0);
    await expect.poll(async () => (await page.locator(".home-footer").boundingBox()).height).toBeCloseTo(footerHeight, 0);
    expect((await page.locator(".orderPage").boundingBox()).width, `${mode} order canvas`).toBeCloseTo(orderWidth, 0);
  }
});
