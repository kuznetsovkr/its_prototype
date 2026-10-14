import { expect, test } from "@playwright/test";

test.setTimeout(90_000);

const slides = [
  { id: "order", label: "Как заказать", color: "rgb(22, 22, 22)", text: "самостоятельно на нашем сайте" },
  { id: "delivery", label: "Доставка", color: "rgb(60, 30, 31)", text: "После упаковки изделия" },
  { id: "care", label: "Уход", color: "rgb(30, 42, 60)", text: "до 150°C" },
  { id: "returns", label: "Обмен и возврат", color: "rgb(30, 60, 51)", text: "несоответствием согласованному макету" },
  { id: "wholesale", label: "Оптовые заказы", color: "rgb(41, 30, 60)", text: "Минимальный тираж — от 10 изделий" },
];

for (const viewport of [
  { name: "desktop", width: 1920, height: 1080 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`approved customer photos, colors and complete text: ${viewport.name}`, async ({ page }, testInfo) => {
    test.skip(
      viewport.name === "mobile"
        ? testInfo.project.name !== "mobile-chromium"
        : testInfo.project.name !== "desktop-chromium",
      "Check each viewport once in its native interaction mode",
    );
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const customers = page.locator(".home-customers");
    const sources = new Set();

    for (const slide of slides) {
      await customers.getByRole("tab", { name: slide.label, exact: true }).click();
      await expect(customers.getByRole("tab", { name: slide.label, exact: true })).toHaveCSS("font-weight", "600");
      const panel = customers.getByRole("tabpanel");
      await expect(panel).toHaveCount(1);
      const content = panel.locator(".home-customers__content");
      await expect(content).toHaveClass(new RegExp(`home-customers__content--${slide.id}`));
      await expect(panel).toContainText(slide.text);
      await expect(viewport.name === "mobile" ? content : panel.locator(".home-customers__copy"))
        .toHaveCSS("background-color", slide.color);

      const image = panel.locator(".home-customers__image");
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
      await expect(image).toHaveCSS("object-fit", "cover");
      const src = await image.evaluate((img) => img.currentSrc);
      expect(src).toMatch(new RegExp(`/${slide.id}${viewport.name === "mobile" ? "-mobile" : ""}-[^/]+\\.webp$`));
      sources.add(src);

      const geometry = await content.evaluate((element) => {
        const photo = element.querySelector(".home-customers__photo").getBoundingClientRect();
        const imageBounds = element.querySelector("img").getBoundingClientRect();
        const copy = element.querySelector(".home-customers__copy");
        const copyBounds = copy.getBoundingClientRect();
        const contentBounds = element.getBoundingClientRect();
        const inner = element.closest(".home-customers__inner").getBoundingClientRect();
        return {
          photoWidth: photo.width, photoHeight: photo.height, copyHeight: copyBounds.height,
          photoFits: Math.abs(photo.width - imageBounds.width) < 1 && Math.abs(photo.height - imageBounds.height) < 1,
          textFits: copy.scrollHeight <= copy.clientHeight + 1,
          contentFits: contentBounds.left >= inner.left - 1 && contentBounds.right <= inner.right + 1
            && contentBounds.bottom <= inner.bottom + 1,
          textInsideCard: copyBounds.bottom <= contentBounds.bottom + 1,
        };
      });
      expect(geometry.photoFits).toBe(true);
      expect(geometry.textFits).toBe(true);
      expect(geometry.contentFits).toBe(true);
      expect(geometry.textInsideCard).toBe(true);
      if (viewport.name === "mobile") {
        expect(geometry.photoHeight).toBeCloseTo(geometry.photoWidth, 0);
      } else {
        expect(geometry.photoHeight).toBeCloseTo(geometry.copyHeight, 0);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);

      if (slide.id === "order" || slide.id === "care") {
        await customers.screenshot({
          path: testInfo.outputPath(`customers-${slide.id}-${viewport.name}.png`),
          // A long element capture would otherwise include the sticky header
          // in the middle of the image; only hide it for the screenshot.
          style: ".home-header { visibility: hidden !important; }",
        });
      }
    }
    expect(sources.size).toBe(5);
  });
}

test("all slides fit at compact boundaries and narrow / ultrawide desktop sizes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Run the width matrix once");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const customers = page.locator(".home-customers");
  for (const width of [320, 639, 640, 1199, 1200, 2560]) {
    await page.setViewportSize({ width, height: 900 });
    for (const slide of slides) {
      await customers.getByRole("tab", { name: slide.label, exact: true }).click();
      const panel = customers.getByRole("tabpanel");
      await expect(panel).toContainText(slide.text);
      const fits = await panel.evaluate((element) => {
        const content = element.querySelector(".home-customers__content").getBoundingClientRect();
        const inner = element.closest(".home-customers__inner").getBoundingClientRect();
        const copy = element.querySelector(".home-customers__copy");
        return content.left >= inner.left - 1 && content.right <= inner.right + 1
          && content.bottom <= inner.bottom + 1 && copy.scrollHeight <= copy.clientHeight + 1;
      });
      expect(fits, `${slide.id} fits at ${width}px`).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  }
});

test("keyboard switching and viewport changes retain the right slide without previous content", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Check keyboard navigation once");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const customers = page.locator(".home-customers");
  const tabs = customers.getByRole("tab");
  await tabs.first().focus();
  for (let i = 1; i < slides.length; i += 1) {
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(i)).toBeFocused();
    await expect(tabs.nth(i)).toHaveAttribute("aria-selected", "true");
    await expect(customers.getByRole("tabpanel")).toContainText(slides[i].text);
    await expect(customers.getByRole("tabpanel")).not.toContainText(slides[i - 1].text);
  }
  for (const width of [390, 820, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(tabs.last()).toHaveAttribute("aria-selected", "true");
    await expect(customers.getByRole("tabpanel")).toContainText(slides[4].text);
  }
  await tabs.last().focus();
  await page.keyboard.press("Home");
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  await expect(customers.getByRole("tabpanel")).toContainText(slides[0].text);
});
