import { describe, expect, it } from "vitest";
import {
  DEFAULT_SITE_URL,
  NOT_FOUND_SEO,
  SEO_ROUTES,
  buildRobotsTxt,
  buildSitemapXml,
  getCanonicalUrl,
  getRobotsDirective,
  getSeoMetadata,
  normalizeSeoPath,
  normalizeSiteUrl,
} from "../../seo.config.mjs";

describe("SEO configuration", () => {
  it("normalizes route paths and returns safe metadata for unknown pages", () => {
    expect(normalizeSeoPath("/order/?step=2#form")).toBe("/order");
    expect(getSeoMetadata("/unknown")).toBe(NOT_FOUND_SEO);
  });

  it("keeps every non-public workflow page out of the index", () => {
    const indexablePaths = Object.entries(SEO_ROUTES)
      .filter(([, metadata]) => metadata.indexable)
      .map(([pathname]) => pathname);

    expect(indexablePaths).toEqual(["/"]);
    expect(getRobotsDirective(SEO_ROUTES["/"], true)).toContain("index");
    expect(getRobotsDirective(SEO_ROUTES["/order"], true)).toContain("noindex");
    expect(getRobotsDirective(SEO_ROUTES["/"], false)).toContain("noindex");
  });

  it("generates closed staging rules and a production sitemap with public pages only", () => {
    const stagingRobots = buildRobotsTxt({
      allowIndexing: false,
      siteUrl: DEFAULT_SITE_URL,
    });
    const productionRobots = buildRobotsTxt({
      allowIndexing: true,
      siteUrl: DEFAULT_SITE_URL,
    });
    const sitemap = buildSitemapXml(DEFAULT_SITE_URL);

    expect(stagingRobots).toBe("User-agent: *\nDisallow: /\n");
    expect(productionRobots).toContain("Sitemap: https://its-site.ru/sitemap.xml");
    expect(productionRobots).not.toContain("Disallow:");
    expect(sitemap).toContain("<loc>https://its-site.ru/</loc>");
    expect(sitemap).not.toContain("/certificate");
    expect(sitemap).not.toContain("/order");
  });

  it("creates canonicals only for pages that explicitly allow them", () => {
    expect(getCanonicalUrl("/", DEFAULT_SITE_URL)).toBe("https://its-site.ru/");
    expect(getCanonicalUrl("/certificate", DEFAULT_SITE_URL)).toBe(
      "https://its-site.ru/certificate"
    );
    expect(getCanonicalUrl("/order", DEFAULT_SITE_URL)).toBeNull();
  });

  it("accepts only a clean HTTPS origin", () => {
    expect(normalizeSiteUrl("https://its-site.ru/")).toBe("https://its-site.ru");
    expect(() => normalizeSiteUrl("http://its-site.ru")).toThrow();
    expect(() => normalizeSiteUrl("https://its-site.ru/path")).toThrow();
  });
});
