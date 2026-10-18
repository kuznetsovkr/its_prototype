/* global document, getComputedStyle -- Playwright browser callbacks */
import { expect, test } from "@playwright/test";
import { URL } from "node:url";

test.setTimeout(120_000);

const artwork = {
  header: { width: 127, height: 56, color: "#1C1918" },
  cover: { width: 371, height: 162, color: "#F0F0F0" },
  footer: { width: 448, height: 186, color: "#F4F0E6" },
};

test("SVG-логотипы сохраняют варианты, размеры и пропорции на главной, внутренних страницах и в меню", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const mobile = Boolean(info.project.use.isMobile);
  const widths = mobile ? [320, 390, 639] : [640, 1024, 1199, 1200, 1440, 2560];
  const checkedSources = new Set();

  const expectLogo = async (selector, role) => {
    const image = page.locator(selector);
    const expected = artwork[role];
    await expect(image).toBeVisible();
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
    await expect(image).toHaveCSS("object-fit", "contain");
    const result = await image.evaluate(element => ({
      source: element.currentSrc,
      naturalWidth: element.naturalWidth,
      naturalHeight: element.naturalHeight,
      filter: getComputedStyle(element).filter,
    }));
    expect(new URL(result.source).pathname).toMatch(new RegExp(`/logo-${role}(?:-[\\w-]+)?\\.svg$`));
    expect(result.naturalWidth).toBe(expected.width);
    expect(result.naturalHeight).toBe(expected.height);
    expect(result.filter).toBe("none");
    if (!checkedSources.has(result.source)) {
      const response = await page.request.get(result.source);
      expect(response.ok()).toBe(true);
      expect(response.headers()["content-type"]).toContain("image/svg+xml");
      const svg = await response.text();
      expect(svg).toContain(`fill="${expected.color}"`);
      expect(svg).not.toMatch(/<(?:image|script|foreignObject|text)\b/i);
      checkedSources.add(result.source);
    }
    return image;
  };

  for (const route of ["/", "/certificate"]) {
    await page.setViewportSize({ width: widths[0], height: 900 });
    await page.goto(route);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      const factor = width < 640 ? width / 320 : width < 1200 ? width / 640 : 1;
      const header = await expectLogo(".home-header__logo-image", "header");
      const headerWidth = width < 640 ? 68.036 : width < 1200 ? 54 : 127;
      expect((await header.boundingBox()).width).toBeCloseTo(headerWidth * factor, 0);
      if (route === "/") await expectLogo(".home-hero__brand", width < 640 ? "footer" : "cover");
      const footer = await expectLogo(".home-footer__logo", "footer");
      const footerWidth = width < 640 ? 280 : width < 1200 ? 367 : 448;
      expect((await footer.boundingBox()).width).toBeCloseTo(footerWidth * factor, 0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);

      if (width < 640) {
        const trigger = page.getByRole("button", { name: "Открыть меню", exact: true });
        await trigger.scrollIntoViewIfNeeded();
        await trigger.click();
        await expect(page.getByRole("dialog", { name: "Мобильное меню" })).toBeVisible();
        const menuLogo = await expectLogo(".home-header__menu-logo img", "header");
        expect((await menuLogo.boundingBox()).width).toBeCloseTo(100 * factor, 0);
        await page.screenshot({ path: info.outputPath(`brand-menu-${route === "/" ? "home" : "internal"}-${width}.png`) });
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog", { name: "Мобильное меню" })).toBeHidden();
        await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
      }
    }
    await page.locator(".home-header").screenshot({ path: info.outputPath(`brand-header-${route === "/" ? "home" : "internal"}.png`) });
    await page.locator(".home-footer").screenshot({ path: info.outputPath(`brand-footer-${route === "/" ? "home" : "internal"}.png`) });
  }
});
