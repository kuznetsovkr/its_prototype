import { expect, test } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1920, height: 1080 },
  { name: "small-desktop", width: 1200, height: 900 },
  { name: "ultrawide", width: 2560, height: 1080 },
  { name: "tablet", width: 1024, height: 768 },
  { name: "mobile", width: 390, height: 844 },
  { name: "small-mobile", width: 320, height: 700 },
];

for (const viewport of viewports) {
  test(`свечение сертификата проходит над подложкой, не мешая управлению: ${viewport.name}`, async ({ page }, testInfo) => {
    test.skip(viewport.name.includes("mobile")
      ? testInfo.project.name !== "mobile-chromium"
      : testInfo.project.name !== "desktop-chromium", "Соответствующий режим устройства");
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/certificate");

    const glow = page.locator(".certificatePage__glowImage");
    await expect(glow).toHaveCSS("animation-name", "certificate-glow-pulse");
    await expect(glow).toHaveCSS("animation-duration", "2s");
    await expect(glow).toHaveCSS("animation-iteration-count", "infinite");
    await expect.poll(() => glow.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    const image = await glow.evaluate(element => ({
      width: element.naturalWidth, height: element.naturalHeight,
      local: new URL(element.currentSrc).origin === location.origin,
      blur: Number(getComputedStyle(element).filter.match(/blur\(([\d.]+)px\)/)?.[1]),
      glowSize: element.closest(".certificatePage__glow").getBoundingClientRect().width,
    }));
    expect(image.width).toBe(image.height);
    expect(image.blur).toBeCloseTo(image.glowSize / 9, 1);
    await expect(glow).toHaveCSS("object-fit", "cover");
    expect(image.local).toBe(true);

    const frames = await glow.evaluate(element => {
      const animation = element.getAnimations()[0];
      animation.pause();
      return [0, 1000, 2000].map(time => {
        animation.currentTime = time;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return { scale: Number(style.scale), opacity: Number(style.opacity),
          centerX: rect.x + rect.width / 2, centerY: rect.y + rect.height / 2 };
      });
    });
    expect(frames.map(frame => frame.scale)).toEqual([0.92, 1.08, 0.92]);
    expect(frames.map(frame => frame.opacity)).toEqual([0.65, 1, 0.65]);
    expect(frames[0].centerX).toBeCloseTo(frames[1].centerX, 1);
    expect(frames[0].centerY).toBeCloseTo(frames[1].centerY, 1);

    const geometry = await page.locator(".certificatePage__card").evaluate(card => {
      const surface = card.querySelector(".certificatePage__offerSurface");
      const content = card.querySelector(".certificatePage__offer");
      const glowLayer = card.querySelector(".certificatePage__visualSurface");
      const glowBox = card.querySelector(".certificatePage__glow").getBoundingClientRect();
      const surfaceBox = surface.getBoundingClientRect();
      const contentBox = content.getBoundingClientRect();
      return {
        surface: [surfaceBox.x, surfaceBox.y, surfaceBox.width, surfaceBox.height],
        content: [contentBox.x, contentBox.y, contentBox.width, contentBox.height],
        glowZ: Number(getComputedStyle(glowLayer).zIndex),
        surfaceZ: Number(getComputedStyle(surface).zIndex),
        contentZ: Number(getComputedStyle(content).zIndex),
        overlaps: glowBox.right > surfaceBox.left && glowBox.left < surfaceBox.right
          && glowBox.bottom > surfaceBox.top && glowBox.top < surfaceBox.bottom,
        pointerEvents: getComputedStyle(glowLayer).pointerEvents,
      };
    });
    expect(geometry.surface).toEqual(geometry.content);
    expect(geometry.glowZ).toBeGreaterThan(geometry.surfaceZ);
    expect(geometry.contentZ).toBeGreaterThan(geometry.glowZ);
    expect(geometry.pointerEvents).toBe("none");
    expect(geometry.overlaps).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);

    await glow.evaluate(element => { element.getAnimations()[0].currentTime = 1000; });
    await page.locator(".certificatePage").screenshot({ path: testInfo.outputPath(`certificate-glow-${viewport.name}.png`) });
    const select = page.getByRole("combobox", { name: "Номинал" });
    await select.selectOption("6000");
    await expect(page.locator(".certificatePage__amount")).toHaveText(/6\s*000 ₽/);
    const action = page.getByRole("button", { name: "Подарить сертификат" });
    expect(await action.evaluate(element => {
      const box = element.getBoundingClientRect();
      return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
    })).toBe(true);
    await action.click();
    await expect(page.getByRole("heading", { name: "Введите свои данные" })).toBeVisible();
    await page.getByRole("button", { name: "Вернуться к номиналам" }).click();
    await expect(select).toHaveValue("6000");
  });
}

test("уменьшение движения останавливает свечение сертификата без скрытия изображения", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/certificate");
  const glow = page.locator(".certificatePage__glowImage");
  await expect(glow).toHaveCSS("animation-name", "none");
  await expect(glow).toHaveCSS("scale", "1");
  await expect(glow).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(glow).toHaveCSS("animation-name", "certificate-glow-pulse");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(glow).toHaveCSS("animation-name", "none");
});
