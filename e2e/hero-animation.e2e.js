import { expect, test } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 1024, height: 768 },
  { name: "mobile", width: 390, height: 844 },
];

for (const viewport of viewports) {
  test(`подпись и кнопка первого экрана появляются из центра: ${viewport.name}`, async ({ page }, testInfo) => {
    test.skip(
      viewport.name === "mobile"
        ? testInfo.project.name !== "mobile-chromium"
        : testInfo.project.name !== "desktop-chromium",
      "Проверяем ширину в соответствующем браузерном режиме",
    );

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");
    await expect(page.locator(".home-hero__order")).toBeVisible();

    const result = await page.evaluate(() => {
      const measure = (selector) => {
        const element = document.querySelector(selector);
        element.style.animation = "none";
        void element.offsetWidth;
        element.style.animation = "";
        const animation = element.getAnimations().find((item) => item.animationName?.startsWith("home-hero-entrance"));
        if (!animation) return null;

        animation.pause();
        animation.currentTime = 0;
        const start = element.getBoundingClientRect();
        const startOpacity = Number(getComputedStyle(element).opacity);

        animation.currentTime = 1000;
        const end = element.getBoundingClientRect();
        const endOpacity = Number(getComputedStyle(element).opacity);

        return {
          duration: animation.effect.getTiming().duration,
          startWidth: start.width,
          endWidth: end.width,
          startCenter: start.x + start.width / 2,
          endCenter: end.x + end.width / 2,
          startOpacity,
          endOpacity,
        };
      };

      return {
        subtitle: measure(".home-hero__subtitle"),
        button: measure(".home-hero__order"),
        logoAnimation: getComputedStyle(document.querySelector(".home-hero__brand")).animationName,
      };
    });

    expect(result.logoAnimation).toBe("none");
    for (const element of [result.subtitle, result.button]) {
      expect(element).not.toBeNull();
      expect(element.duration).toBe(1000);
      expect(element.startWidth / element.endWidth).toBeCloseTo(0.5, 1);
      expect(element.startCenter).toBeCloseTo(element.endCenter, 0);
      expect(element.startOpacity).toBe(0);
      expect(element.endOpacity).toBe(1);
    }

    await page.locator(".home-hero__order").click();
    await expect(page).toHaveURL(/\/order$/);
  });
}

test("при уменьшенном движении первый экран сразу показывает подпись и кнопку", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".home-hero__order")).toBeVisible();

  const result = await page.locator(".home-hero__subtitle, .home-hero__order").evaluateAll((elements) =>
    elements.map((element) => ({
      animation: getComputedStyle(element).animationName,
      opacity: getComputedStyle(element).opacity,
      widthRatio: element.getBoundingClientRect().width / element.offsetWidth,
    })));

  expect(result).toHaveLength(2);
  for (const element of result) {
    expect(element.animation).toBe("none");
    expect(element.opacity).toBe("1");
    expect(element.widthRatio).toBeCloseTo(1, 1);
  }
});
