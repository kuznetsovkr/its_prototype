import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort());
  await page.route("**/service.php**", (route) => route.abort());
  await page.route("**/api/public-config", (route) => route.fulfill({ json: { turnstile: { enabled: false } } }));
});

test("mobile order steps start at the top while wider layouts preserve their position", async ({ page }, info) => {
  test.skip(info.project.name.endsWith("live-checkout"), "The full route sequence uses the demo catalog");
  const isMobile = Boolean(info.project.use.isMobile);
  await page.goto("/order");
  await page.locator('.selectorType__item:has(input[value="Hoodie"])').click();
  await page.locator('.sizeSelector__item:has(input[value="M"]) .sizeSelector__box').click();
  const clothingNext = page.locator(".orderNavigation .orderActionButton--next");
  await expect(clothingNext).toBeEnabled();

  await page.evaluate(() => window.scrollTo(0, 300));
  const clothingScrollPosition = await page.evaluate(() => window.scrollY);
  expect(clothingScrollPosition).toBeGreaterThan(0);
  await clothingNext.evaluate((button) => button.click());
  await expect(page).toHaveURL(/\/embroidery$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(isMobile ? 0 : clothingScrollPosition);

  const embroideryNext = page.locator(".embroiderySelectorDesktop__navigation .is-next");
  await page.locator('.embroideryDesktopChoice:has(input[value="Patronus"]) .embroideryDesktopChoice__select').click();
  await expect(embroideryNext).toBeEnabled();
  await page.evaluate(() => window.scrollTo(0, 300));
  const embroideryScrollPosition = await page.evaluate(() => window.scrollY);
  await embroideryNext.evaluate((button) => button.click());
  await expect(page).toHaveURL(/\/recipient$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(isMobile ? 0 : embroideryScrollPosition);

  await page.evaluate(() => window.scrollTo(0, 300));
  const recipientScrollPosition = await page.evaluate(() => window.scrollY);
  await page.locator(".recipientOrderCard__backArrow").evaluate((button) => button.click());
  await expect(page).toHaveURL(/\/embroidery$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(isMobile ? 0 : recipientScrollPosition);
  await expect(page.locator('input[name="embroideryTypeDesktop"][value="Patronus"]')).toBeChecked();

  await page.evaluate(() => window.scrollTo(0, 300));
  const selectedScrollPosition = await page.evaluate(() => window.scrollY);
  await page.getByRole("button", { name: "Увеличить количество" }).evaluate((button) => button.click());
  await expect(page.locator(".embroideryDesktopCounter__value")).toHaveText("2 шт");
  expect(await page.evaluate(() => window.scrollY)).toBe(selectedScrollPosition);

  await page.locator(".embroiderySelectorDesktop__navigation .is-back").evaluate((button) => button.click());
  await expect(page).toHaveURL(/\/order$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(isMobile ? 0 : selectedScrollPosition);
  await expect(page.locator('input[name="size"][value="M"]')).toBeChecked();
  await page.locator('a[href="/certificate"]').first().evaluate((link) => link.click());
  await expect(page).toHaveURL(/\/certificate$/);
  await expect(page.locator(".certificatePage")).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.history.scrollRestoration)).toBe("auto");
});

test("upload substeps reset mobile scrolling without resetting fields or files", async ({ page }, info) => {
  test.skip(!info.project.name.endsWith("live-checkout"), "The upload step must run without the demo shortcut");
  const isMobile = Boolean(info.project.use.isMobile);
  await page.addInitScript(() => {
    window.sessionStorage.setItem("its_order_draft_v1", JSON.stringify({ version: 1, uploadFiles: [], order: {
      clothing: { type: "Hoodie", color: "Чёрный", size: "M" },
      embroidery: { type: "Car", typeSelectionExplicit: true, uploadedImage: [] },
    } }));
  });
  await page.route("**/api/pricing/quote", (route) => route.fulfill({ json: { prices: { Car: 7000 } } }));
  await page.goto("/embroidery");
  const next = page.locator(".embroiderySelectorDesktop__navigation .is-next");
  const back = page.locator(".embroiderySelectorDesktop__navigation .is-back");
  await expect(next).toBeEnabled();

  const advance = async (button) => {
    await page.evaluate(() => window.scrollTo({ top: 300, behavior: "instant" }));
    const previous = await page.evaluate(() => window.scrollY);
    expect(previous).toBeGreaterThan(0);
    await button.evaluate((element) => element.click());
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(isMobile ? 0 : previous);
  };
  await advance(next);
  await expect(page.getByRole("heading", { name: "Загрузите ваше изображение" })).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({ name: "car.png", mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aHy4AAAAASUVORK5CYII=", "base64") });
  const comment = page.getByRole("textbox", { name: "Комментарий", exact: true });
  await comment.fill("Сохранить ракурс");
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await advance(back);
  await expect(page.getByRole("heading", { name: "Выберите тип вышивки" })).toBeVisible();
  await advance(next);
  await expect(comment).toHaveValue("Сохранить ракурс");
  await expect(page.locator(".embroideryUploadStage__summary")).toHaveText("Загружено файлов: 1");
  await expect(page.locator(".embroideryUploadStage__files")).toContainText("car.png");
  await advance(next);
  await expect(page).toHaveURL(/\/recipient$/);
});
