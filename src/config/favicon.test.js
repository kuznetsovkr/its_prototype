import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const readPublicAsset = (name) => readFileSync(new URL(`../../public/${name}`, import.meta.url));
const indexHtml = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
const manifest = JSON.parse(readPublicAsset("manifest.json").toString("utf8"));

describe("site favicons", () => {
  test("uses the new version of the browser, Apple and manifest icons", () => {
    for (const href of ["/favicon.ico?v=3", "/favicon-96x96.png?v=3", "/favicon.svg?v=3", "/apple-touch-icon.png?v=3", "/manifest.json?v=3"]) {
      expect(indexHtml).toContain(`href="${href}"`);
    }
    expect(indexHtml).not.toMatch(/favicon-(16x16|32x32)|\?v=2/);
    expect(indexHtml).toContain('type="image/svg+xml"');
    expect(indexHtml).toContain('sizes="96x96"');
    expect(indexHtml).toContain('sizes="180x180"');
  });

  test("keeps the brand and theme and points to valid application icons", () => {
    expect(manifest.name).toBe("ITS — кастомная вышивка");
    expect(manifest.short_name).toBe("ITS");
    expect(manifest.start_url).toBe(".");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBe("#f4f0e6");
    expect(manifest.background_color).toBe("#f4f0e6");
    expect(manifest.icons).toEqual([
      { src: "/web-app-manifest-192x192.png?v=3", sizes: "192x192", type: "image/png" },
      { src: "/web-app-manifest-512x512.png?v=3", sizes: "512x512", type: "image/png" },
    ]);
  });

  test("PNG dimensions match the declared sizes and fallback files exist", () => {
    for (const [name, size] of [
      ["favicon-96x96.png", 96], ["apple-touch-icon.png", 180],
      ["web-app-manifest-192x192.png", 192], ["web-app-manifest-512x512.png", 512],
    ]) {
      const png = readPublicAsset(name);
      expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      expect(png.readUInt32BE(16)).toBe(size);
      expect(png.readUInt32BE(20)).toBe(size);
    }
    expect(readPublicAsset("favicon.ico").subarray(0, 4).toString("hex")).toBe("00000100");
    expect(readPublicAsset("favicon.svg").toString("utf8")).toMatch(/<svg\b[^>]*viewBox="0 0 64 64"/);
  });
});
