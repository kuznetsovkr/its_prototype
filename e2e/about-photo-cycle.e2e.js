import { expect, test } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 1024, height: 768 },
  { name: "mobile", width: 390, height: 844 },
];

for (const viewport of viewports) {
  test(`оба фото блока «О бренде» заполняют кадр: ${viewport.name}`, async ({ page }, testInfo) => {
    test.skip(
      viewport.name === "mobile"
        ? testInfo.project.name !== "mobile-chromium"
        : testInfo.project.name !== "desktop-chromium",
      "Проверяем ширину в соответствующем браузерном режиме",
    );

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const photo = page.locator(".home-about__photo");
    await expect(photo).toBeVisible();
    await photo.scrollIntoViewIfNeeded();
    await expect(page.locator(".home-about__photo-slide--woman")).toHaveClass(/is-active/);

    const geometry = await photo.evaluate(async (container) => {
      const images = [...container.querySelectorAll("img")];
      await Promise.all(images.map((image) => image.decode()));
      const frame = container.getBoundingClientRect();
      return images.map((image) => {
        const rect = image.getBoundingClientRect();
        return {
          naturalWidth: image.naturalWidth,
          aspectRatioError: Math.abs(rect.width / rect.height - image.naturalWidth / image.naturalHeight),
          coversWidth: rect.left <= frame.left + 1 && rect.right >= frame.right - 1,
          coversHeight: rect.top <= frame.top + 1 && rect.bottom >= frame.bottom - 1,
        };
      });
    });

    expect(geometry).toHaveLength(2);
    for (const image of geometry) {
      expect(image.naturalWidth).toBeGreaterThan(0);
      expect(image.aspectRatioError).toBeLessThan(0.01);
      expect(image.coversWidth).toBe(true);
      expect(image.coversHeight).toBe(true);
    }
  });
}

test("фото меняются через пять секунд с появлением справа", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Достаточно проверить таймер в одном браузере");

  await page.goto("/");
  await page.locator(".home-about__photo").scrollIntoViewIfNeeded();
  const woman = page.locator(".home-about__photo-slide--woman");
  const dog = page.locator(".home-about__photo-slide--dog");
  await expect(woman).toHaveClass(/is-active/);
  await expect(dog).toHaveClass(/is-active/, { timeout: 7000 });
  await expect(dog).toHaveClass(/is-entering/);
  await expect(dog).toHaveCSS("animation-duration", "0.7s");

  const animationFrames = await dog.evaluate((element) => {
    const animation = element.getAnimations().find((item) => item.animationName === "home-about-photo-enter");
    animation.pause();
    animation.currentTime = 0;
    const start = {
      opacity: Number(getComputedStyle(element).opacity),
      x: new DOMMatrixReadOnly(getComputedStyle(element).transform).m41,
    };
    animation.currentTime = 700;
    const end = {
      opacity: Number(getComputedStyle(element).opacity),
      x: new DOMMatrixReadOnly(getComputedStyle(element).transform).m41,
    };
    return { start, end };
  });

  expect(animationFrames.start.opacity).toBe(0);
  expect(animationFrames.start.x).toBeCloseTo(30, 0);
  expect(animationFrames.end.opacity).toBe(1);
  expect(animationFrames.end.x).toBe(0);
});

test("при уменьшенном движении фото не меняются автоматически", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Достаточно проверить настройку в одном браузере");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator(".home-about__photo").scrollIntoViewIfNeeded();
  await expect(page.locator(".home-about__photo-slide--woman")).toHaveClass(/is-active/);
  await page.waitForTimeout(5300);
  await expect(page.locator(".home-about__photo-slide--woman")).toHaveClass(/is-active/);
});
