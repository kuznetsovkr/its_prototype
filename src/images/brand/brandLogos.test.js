import { describe, expect, it } from "vitest";
import { brandLogos } from "./index";
import headerSvg from "./logo-header.svg?raw";
import coverSvg from "./logo-cover.svg?raw";
import footerSvg from "./logo-footer.svg?raw";
import { homeAssets, siteFooterAssets, siteHeaderAssets } from "../home";

describe("supplied vector brand logos", () => {
  it.each([
    ["header", headerSvg, "0 0 127 56", "#1C1918"],
    ["cover", coverSvg, "0 0 371 162", "#F0F0F0"],
    ["footer", footerSvg, "0 0 448 186", "#F4F0E6"],
  ])("keeps %s as genuine, self-contained vector artwork", (role, svg, viewBox, color) => {
    expect(brandLogos[role]).toMatch(/\.svg$/);
    expect(svg).toContain(`viewBox="${viewBox}"`);
    expect(svg).toContain(`fill="${color}"`);
    expect(svg.match(/<path\b/g)).toHaveLength(11);
    expect(svg).not.toMatch(/<(?:image|script|foreignObject|text)\b/i);
    expect(svg).not.toMatch(/\b(?:href|xlink:href)\s*=\s*["'](?:https?:|data:|file:)/i);
    expect(svg).not.toMatch(/\bon\w+\s*=/i);
  });

  it.each(["desktop", "tablet", "mobile"])("uses the supplied header and footer at %s size", (breakpoint) => {
    expect(siteHeaderAssets[`${breakpoint}Logo`]).toBe(brandLogos.header);
    expect(homeAssets[breakpoint].hero.logoGraphite).toBe(brandLogos.header);
    expect(homeAssets[breakpoint].footer.logoMilk).toBe(brandLogos.footer);
    expect(siteFooterAssets.home.logo[breakpoint]).toBe(brandLogos.footer);
    expect(siteFooterAssets.internal.logo[breakpoint]).toBe(brandLogos.footer);
  });

  it("keeps the desktop/tablet cover and mobile-menu artwork mapped to their approved variants", () => {
    expect(homeAssets.desktop.hero.logoMilk).toBe(brandLogos.cover);
    expect(homeAssets.tablet.hero.logoMilk).toBe(brandLogos.cover);
    expect(homeAssets.mobile.hero.headerLogo).toBe(brandLogos.header);
    expect(siteHeaderAssets.menu.logo).toBe(brandLogos.header);
  });
});
