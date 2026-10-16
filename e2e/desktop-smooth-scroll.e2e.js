/* global document, window, performance, requestAnimationFrame */
import { expect, test } from "@playwright/test";

const startDesktop = async (page) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/\blenis\b/);
  await expect(page.locator(".home-hero__desktop-subject")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};

const monitorWheel = async (page) => {
  await page.evaluate(() => {
    window.lastWheelPrevented = null;
    window.addEventListener("wheel", (event) => {
      window.lastWheelPrevented = event.defaultPrevented;
    }, { once: true });
  });
};

test.describe("desktop smooth scrolling", () => {
  // eslint-disable-next-line no-empty-pattern -- Playwright requires fixture destructuring.
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "Desktop input checks");
  });

  test("wheel movement is animated and scroll-driven blocks keep updating", async ({ page }) => {
    await startDesktop(page);
    await page.evaluate(() => window.scrollTo({ top: 800, behavior: "instant" }));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(800);
    await page.mouse.move(10, 450);
    await monitorWheel(page);
    await page.evaluate(() => {
      window.scrollSamples = [];
      const start = performance.now();
      const sample = () => {
        window.scrollSamples.push(window.scrollY);
        if (performance.now() - start < 1600) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.mouse.wheel(0, 120);
    await expect.poll(() => page.evaluate(() => window.lastWheelPrevented)).toBe(true);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(875);
    expect(await page.evaluate(() => new Set(window.scrollSamples.filter(y => y > 800 && y < 875)).size)).toBeGreaterThan(3);
    await expect(page.locator(".home-header")).toHaveClass(/home-header--scrolled/);
    expect(await page.locator(".home-about").evaluate(el => Number(el.style.getPropertyValue("--home-scroll-zoom-scale")))).toBeGreaterThan(0.8);
  });

  test("touchpad and horizontal gestures are not intercepted", async ({ page }) => {
    await startDesktop(page);
    await page.mouse.move(10, 450);
    await monitorWheel(page);
    await page.mouse.wheel(0, 23);
    await expect.poll(() => page.evaluate(() => window.lastWheelPrevented)).toBe(false);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    const carousel = page.locator(".home-reviews-carousel__viewport");
    await carousel.scrollIntoViewIfNeeded();
    await carousel.hover();
    await monitorWheel(page);
    const startLeft = await carousel.evaluate(el => el.scrollLeft);
    // Move a full card: a fixed 180px delta can snap back to the first card.
    const scrollStep = await carousel.evaluate(element => {
      const cards = element.querySelectorAll(".home-reviews-carousel__item");
      return cards[1].offsetLeft - cards[0].offsetLeft;
    });
    await page.mouse.wheel(scrollStep, 0);
    await expect.poll(() => page.evaluate(() => window.lastWheelPrevented)).toBe(false);
    await expect.poll(() => carousel.evaluate(el => el.scrollLeft)).toBeGreaterThan(startLeft + 100);
  });

  test("modal locks cancel inertia and keep the modal scrollable", async ({ page }) => {
    await startDesktop(page);
    const card = page.locator(".home-reviews__card-button").first();
    await card.scrollIntoViewIfNeeded();
    await page.mouse.move(10, 450);
    await page.mouse.wheel(0, 120);
    await card.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page.locator("html")).toHaveClass(/lenis-stopped/);
    const top = await page.evaluate(() => window.scrollY);
    await page.mouse.move(10, 450);
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(900);
    expect(await page.evaluate(() => window.scrollY)).toBe(top);
    const scrollable = await dialog.evaluate(el => ({ height: el.clientHeight, scrollHeight: el.scrollHeight }));
    expect(scrollable.scrollHeight).toBeGreaterThan(scrollable.height);
    await dialog.hover();
    await page.mouse.wheel(0, 120);
    await expect.poll(() => dialog.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page.locator("html")).not.toHaveClass(/lenis-stopped/);
    await page.mouse.move(10, 450);
    await monitorWheel(page);
    await page.mouse.wheel(0, 120);
    await expect.poll(() => page.evaluate(() => window.lastWheelPrevented)).toBe(true);
  });

  test("resize and reduced-motion preferences restore native scrolling", async ({ page }) => {
    await startDesktop(page);
    await page.setViewportSize({ width: 1199, height: 900 });
    await expect(page.locator("html")).not.toHaveClass(/\blenis\b/);
    await page.setViewportSize({ width: 1200, height: 900 });
    await expect(page.locator("html")).toHaveClass(/\blenis\b/);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator("html")).not.toHaveClass(/\blenis\b/);
    await page.mouse.move(10, 450);
    await monitorWheel(page);
    await page.mouse.wheel(0, 120);
    await expect.poll(() => page.evaluate(() => window.lastWheelPrevented)).toBe(false);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(page.locator("html")).toHaveClass(/\blenis\b/);
  });

  test("route navigation cancels old inertia without moving the next page", async ({ page }) => {
    await startDesktop(page);
    await page.mouse.move(10, 450);
    await page.mouse.wheel(0, 120);
    await page.locator(".home-header__link--certificate").click();
    await expect(page).toHaveURL(/\/certificate$/);
    await expect(page.locator("html")).toHaveClass(/\blenis\b/);
    await page.waitForTimeout(900);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("keyboard editing stays native while page scrolling over a plain input stays smooth", async ({ page }) => {
    await startDesktop(page);
    await page.keyboard.press("PageDown");
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
    await page.goto("/admin");
    await expect(page.locator("html")).toHaveClass(/\blenis\b/);
    const input = page.locator('input[type="tel"]');
    await input.focus();
    const top = await page.evaluate(() => window.scrollY);
    await page.keyboard.press("End");
    await page.keyboard.press("ArrowLeft");
    expect(await page.evaluate(() => window.scrollY)).toBe(top);
    await input.hover();
    await monitorWheel(page);
    await page.mouse.wheel(0, 120);
    await expect.poll(() => page.evaluate(() => window.lastWheelPrevented)).toBe(true);
  });

  test("empty textareas scroll the page smoothly; overflowing textareas, selects and number fields stay native", async ({ page }) => {
    await startDesktop(page);
    await page.evaluate(() => {
      const form = document.createElement("div");
      form.id = "scroll-control-fixture";
      form.style.cssText = "position:fixed;top:180px;left:100px;z-index:10000;background:white;padding:20px;display:grid;gap:10px";
      form.innerHTML = '<textarea id="scroll-area" aria-label="Scroll test" style="width:220px;height:70px;overflow:auto"></textarea>'
        + '<select id="scroll-select"><option>A</option><option>B</option></select>'
        + '<input id="scroll-number" type="number" value="5">';
      document.body.append(form);
      window.scrollTo({ top: 800, behavior: "instant" });
    });
    const area = page.locator("#scroll-area");
    await area.hover();
    await monitorWheel(page);
    await page.mouse.wheel(0, 120);
    await expect.poll(() => page.evaluate(() => window.lastWheelPrevented)).toBe(true);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(875);
    await area.fill(Array.from({ length: 40 }, (_, i) => `Line ${i}`).join("\n"));
    await area.evaluate(el => { el.scrollTop = 0; });
    await area.hover();
    await monitorWheel(page);
    const pageTop = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 120);
    await expect.poll(() => page.evaluate(() => window.lastWheelPrevented)).toBe(false);
    await expect.poll(() => area.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(pageTop);
    for (const selector of ["#scroll-select", "#scroll-number"]) {
      await page.locator(selector).hover();
      await monitorWheel(page);
      await page.mouse.wheel(0, 120);
      await expect.poll(() => page.evaluate(() => window.lastWheelPrevented)).toBe(false);
    }
  });
});

test("mobile and wide touch screens retain native scrolling", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Touch device checks");
  for (const width of [390, 1024, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator(".home-hero")).toBeVisible();
    await expect(page.locator("html")).not.toHaveClass(/\blenis\b/);
    await page.mouse.move(10, 450);
    await monitorWheel(page);
    await page.mouse.wheel(0, 120);
    await expect.poll(() => page.evaluate(() => window.lastWheelPrevented)).toBe(false);
  }
});
