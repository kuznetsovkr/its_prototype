/* global document, getComputedStyle, window -- Playwright browser callbacks */
import { expect, test } from "@playwright/test";

test.setTimeout(120_000);

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/public-config", (route) => route.fulfill({
    json: { turnstile: { enabled: false } },
  }));
});

const selectClothing = async (page) => {
  await page.goto("/order");
  await page.locator('.selectorType__item:has(input[value="Hoodie"])').click();
  await page.locator('.sizeSelector__item:has(input[value="M"]) .sizeSelector__box').click();
  await page.locator(".orderActionButton--next").click();
  await expect(page).toHaveURL(/\/embroidery$/);
};

const expectNoHorizontalOverflow = async (page, width) => {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
};

const expectNativeDialog = async (page, dialog, { width, height }) => {
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(height + 1);
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
};

test("all order screens switch layout at 639/640 and 1199/1200 without resetting the order", async ({ page }, testInfo) => {
  test.skip(Boolean(testInfo.project.use.isMobile), "Check the full boundary matrix once");
  await page.setViewportSize({ width: 390, height: 900 });
  await selectClothing(page);
  await page.locator('.embroideryDesktopChoice:has(input[value="Patronus"]) .embroideryDesktopChoice__select').click();
  await page.getByRole("button", { name: "Увеличить количество" }).click();
  const price = page.locator(".embroiderySelectorDesktop__price");
  await expect(price).toContainText(/15\s*000 руб/);
  const widths = [320, 639, 640, 1199, 1200, 1280, 2560, 1199, 390];
  const cases = [
    { route: "/order", root: ".orderPage", panel: ".blockSelection", design: [308, 290, 590] },
    { route: "/embroidery", root: ".embroideryPage", panel: ".embroiderySelectorDesktop__panel", design: [308, 290, 590] },
    { route: "/recipient", root: ".recipientOrderPage", panel: ".recipientOrderForm", design: [308, 290, 590] },
    { route: "/certificate", root: ".certificatePage", panel: ".certificatePage__card", design: [300, 560, 1200] },
  ];
  for (const { route, root, panel, design } of cases) {
    await page.goto(route);
    await expect(page.locator(root)).toBeVisible();
    if (route === "/recipient") {
      await page.getByPlaceholder("ФИО", { exact: true }).fill("Иванов Иван Иванович");
      await page.getByPlaceholder("Номер телефона").fill("+7 999 123-45-67");
      await page.locator(".recipientOrderForm__deliveryMethod").click();
      await page.getByRole("button", { name: "Select demo pickup point" }).click();
      await page.getByRole("checkbox", { name: /Я даю своё согласие/ }).check();
    }
    if (route === "/certificate") await page.getByRole("combobox").selectOption("14000");
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      const modeIndex = width < 640 ? 0 : width < 1200 ? 1 : 2;
      const factor = width < 1200 ? width / (width < 640 ? 320 : 640) : 1;
      await expect.poll(async () => (await page.locator(panel).boundingBox()).width)
        .toBeCloseTo(design[modeIndex] * factor, 0);
      await expect(page.locator(root)).toHaveCSS("transform", "none");
      await expect(page.locator(".home-header--standalone")).toHaveCSS("position", "relative");
      await expectNoHorizontalOverflow(page, width);
      if (route === "/order") {
        await expect(page.locator('input[name="clothing"][value="Hoodie"]')).toBeChecked();
        await expect(page.locator('input[name="size"][value="M"]')).toBeChecked();
      } else if (route === "/embroidery") {
        await expect(page.locator('input[name="embroideryTypeDesktop"][value="Patronus"]')).toBeChecked();
        await expect(page.locator(".embroideryDesktopCounter__value")).toHaveText("2 шт");
        await expect(price).toContainText(/15\s*000 руб/);
      } else if (route === "/recipient") {
        await expect(page.getByPlaceholder("ФИО", { exact: true })).toHaveValue("Иванов Иван Иванович");
        await expect(page.locator(".recipientOrderNavigation__submit")).toBeEnabled();
      } else {
        await expect(page.getByRole("combobox")).toHaveValue("14000");
      }
    }
  }
});

test("rotation keeps text, focus, recipient phone and manual-address modal usable", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.isMobile, "Use the touch browser for rotation");
  await page.setViewportSize({ width: 390, height: 844 });
  await selectClothing(page);
  await page.getByRole("button", { name: "надпись", exact: true }).click();
  const inscription = page.getByPlaceholder("Введите надпись");
  await inscription.fill("Сохранить эту надпись при повороте экрана");
  await inscription.focus();
  for (const viewport of [{ width: 844, height: 390 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await inscription.scrollIntoViewIfNeeded();
    await expect(inscription).toBeFocused();
    await expect(inscription).toHaveValue("Сохранить эту надпись при повороте экрана");
    expect(await inscription.evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
    await expect(inscription).toBeInViewport();
    await expectNoHorizontalOverflow(page, viewport.width);
  }
  await page.locator(".embroiderySelectorDesktop__navigation .is-next").click();
  const recipient = page.locator(".recipientOrderForm__group--recipient input");
  const phone = page.locator(".recipientOrderForm__group--recipientPhone input");
  await recipient.fill("Петров Пётр Петрович");
  await phone.fill("+7 999 234-56-78");
  const phoneValue = await phone.inputValue();
  await page.locator(".recipientOrderForm__deliveryMethod").click();
  await page.getByRole("checkbox", { name: "В моём городе нет СДЭКа" }).check();
  const dialog = page.getByRole("dialog", { name: "Указание адреса ручной доставки" });
  const address = page.locator(".manualAddress__input");
  const addressText = "Красноярск, улица Ленина, дом 1";
  await address.fill(addressText);
  const documentTop = await page.evaluate(() => window.scrollY);
  for (const viewport of [{ width: 844, height: 390 }, { width: 390, height: 844 }, { width: 1024, height: 768 }]) {
    await page.setViewportSize(viewport);
    await expectNativeDialog(page, dialog, viewport);
    await address.scrollIntoViewIfNeeded();
    await address.focus();
    await expect(address).toBeInViewport();
    await expect(address).toHaveValue(addressText);
    expect(await address.evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
    expect(await page.evaluate(() => window.scrollY)).toBe(documentTop);
    await expect(recipient).toHaveValue("Петров Пётр Петрович");
    await expect(phone).toHaveValue(phoneValue);
  }
  await dialog.getByRole("button", { name: "Закрыть", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  await phone.scrollIntoViewIfNeeded();
  await phone.focus();
  await expect(phone).toBeFocused();
});

test("rotation closes the mobile menu and unlocks the page without losing home state", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.isMobile, "Use touch navigation and compact layout boundaries");
  await page.setViewportSize({ width: 430, height: 740 });
  await page.goto("/");
  await page.locator(".home-works__actions").getByRole("button", { name: /ещ[её] примеры/i }).click();
  const faq = page.locator(".home-accordion__trigger").nth(1);
  await faq.click();
  await expect(faq).toHaveAttribute("aria-expanded", "true");
  const deliveryTab = page.locator(".home-customers").getByRole("tab", { name: /доставка/i });
  await deliveryTab.click();
  await expect(deliveryTab).toHaveAttribute("aria-selected", "true");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "Открыть меню" }).click();
  const menu = page.getByRole("dialog", { name: "Мобильное меню" });
  await expect(menu).toBeVisible();
  await page.setViewportSize({ width: 740, height: 430 });
  await expect(menu).toBeHidden();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
  expect(await page.locator("[inert]").count()).toBe(0);
  await expect(page.locator(".home-header__logo")).toBeFocused();
  await expect(page.locator(".home-works")).toHaveClass(/is-expanded/);
  await expect(faq).toHaveAttribute("aria-expanded", "true");
  await expect(deliveryTab).toHaveAttribute("aria-selected", "true");
  for (const viewport of [{ width: 1200, height: 800 }, { width: 639, height: 740 }, { width: 430, height: 740 }]) {
    await page.setViewportSize(viewport);
    await expect(page.locator(".home-page")).toHaveClass(new RegExp(`home-page--${viewport.width < 640 ? "mobile" : "desktop"}`));
    await expectNoHorizontalOverflow(page, viewport.width);
    await expect(page.locator(".home-works")).toHaveClass(/is-expanded/);
    await expect(faq).toHaveAttribute("aria-expanded", "true");
    await expect(deliveryTab).toHaveAttribute("aria-selected", "true");
  }
  await page.getByRole("button", { name: "Открыть меню" }).click();
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(page.getByRole("button", { name: "Открыть меню" })).toBeFocused();
  const viewportContent = await page.locator('meta[name="viewport"]').getAttribute("content");
  expect(viewportContent).not.toMatch(/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1\b/i);
});

test("review and work-example dialogs stay native and scrollable after rotation", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.isMobile, "Use touch viewports for modal rotation");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const review = page.locator(".home-reviews__card-button").first();
  await review.click();
  const reviewDialog = page.getByRole("dialog", { name: "Отзыв клиента 1" });
  for (const viewport of [{ width: 844, height: 390 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await expectNativeDialog(page, reviewDialog, viewport);
    await expect(reviewDialog.getByRole("button", { name: "Закрыть отзыв" })).toBeFocused();
    await expect(page.locator(".modalClose")).toHaveCSS("width", "34px");
    await expectNoHorizontalOverflow(page, viewport.width);
  }
  await page.keyboard.press("Escape");
  await expect(reviewDialog).toHaveCount(0);
  await expect(review).toBeFocused();
  await selectClothing(page);
  const exampleTrigger = page.locator(".embroideryDesktopChoice__example").first();
  await exampleTrigger.click();
  const examples = page.getByRole("dialog", { name: "Примеры работ" });
  for (const viewport of [{ width: 844, height: 390 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await expectNativeDialog(page, examples, viewport);
    await expect(page.locator(".modalClose")).toHaveCSS("width", "34px");
    await examples.evaluate((element) => element.scrollTo(0, element.scrollHeight));
    if (await examples.evaluate((element) => element.scrollHeight > element.clientHeight)) {
      await expect.poll(() => examples.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    }
    // A focused control does not auto-scroll on a repeated focus() call.
    await examples.getByRole("button", { name: "Закрыть окно" }).scrollIntoViewIfNeeded();
    await examples.getByRole("button", { name: "Закрыть окно" }).focus();
    await expect(examples.getByRole("button", { name: "Закрыть окно" })).toBeInViewport();
  }
  await page.keyboard.press("Escape");
  await expect(examples).toHaveCount(0);
  await expect(exampleTrigger).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});
