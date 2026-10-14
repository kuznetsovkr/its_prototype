import { expect, test } from "@playwright/test";
import { SEO_ROUTES } from "../seo.config.mjs";

test("every generated page uses the new favicon set and a branded manifest", async ({ request }) => {
  for (const pathname of [...Object.keys(SEO_ROUTES), "/404.html"]) {
    const response = await request.get(pathname);
    expect(response.ok()).toBe(true);
    const html = await response.text();
    for (const href of ["/favicon.ico?v=3", "/favicon-96x96.png?v=3", "/favicon.svg?v=3", "/apple-touch-icon.png?v=3", "/manifest.json?v=3"]) {
      expect(html).toContain(`href="${href}"`);
    }
    expect(html).not.toMatch(/favicon-(16x16|32x32)|\?v=2/);
  }

  const manifestResponse = await request.get("/manifest.json?v=3");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(manifest.name).toBe("ITS — кастомная вышивка");
  expect(manifest.theme_color).toBe("#f4f0e6");
  for (const pathname of ["/favicon.ico?v=3", "/favicon-96x96.png?v=3", "/favicon.svg?v=3", "/apple-touch-icon.png?v=3", ...manifest.icons.map(({ src }) => src)]) {
    const response = await request.get(pathname);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toMatch(/^image\//);
    expect((await response.body()).length).toBeGreaterThan(0);
  }
});

test("browser icons decode as squares with transparent corners around the circular logo", async ({ page }) => {
  await page.goto("/favicon-96x96.png?v=3");
  const icons = await page.evaluate(async () => {
    const results = [];
    for (const filename of ["favicon-96x96.png", "favicon.svg", "apple-touch-icon.png", "web-app-manifest-192x192.png", "web-app-manifest-512x512.png"]) {
      const image = new Image();
      image.src = `/${filename}?v=3`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      const corners = [[0, 0], [canvas.width - 1, 0], [0, canvas.height - 1], [canvas.width - 1, canvas.height - 1]];
      results.push({ filename, width: image.naturalWidth, height: image.naturalHeight,
        cornerAlpha: corners.map(([x, y]) => context.getImageData(x, y, 1, 1).data[3]),
        centerAlpha: context.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data[3] });
    }
    return results;
  });
  expect(icons).toHaveLength(5);
  for (const icon of icons) {
    expect(icon.width).toBeGreaterThan(0);
    expect(icon.width).toBe(icon.height);
    expect(icon.cornerAlpha).toEqual([0, 0, 0, 0]);
    expect(icon.centerAlpha).toBe(255);
  }
});
