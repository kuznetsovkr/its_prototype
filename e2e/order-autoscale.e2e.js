/* global document, getComputedStyle, queueMicrotask, sessionStorage, window -- Playwright browser callbacks */
import { expect, test } from "@playwright/test";

test.setTimeout(90_000);

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    window.turnstile = {
      render: (_container, options) => {
        queueMicrotask(() => options.callback("autoscale-test-token"));
        return 1;
      },
      remove: () => {},
      reset: () => {},
    };
  });
  await page.route("**/api/public-config", (route) => route.fulfill({
    json: { turnstile: { enabled: true, siteKey: "1x00000000000000000000AA", action: "order_create" } },
  }));
});

const selectClothing = async (page) => {
  await page.goto("/order");
  await page.locator('.selectorType__item:has(input[value="Hoodie"])').click();
  await page.locator('.sizeSelector__item:has(input[value="M"]) .sizeSelector__box').click();
};

const selectEmbroidery = async (page) => {
  await page.goto("/embroidery");
  const type = page.locator('input[name="embroideryTypeDesktop"][value="Patronus"]');
  await expect(type).toBeAttached();
  if (!await type.isChecked()) {
    await page.locator('.embroideryDesktopChoice:has(input[value="Patronus"]) .embroideryDesktopChoice__select').click();
  }
};

const geometry = (page, selectors) => page.evaluate((list) => list.map((selector) => {
  const element = document.querySelector(selector);
  const bounds = element.getBoundingClientRect();
  return { selector, width: bounds.width, height: bounds.height, fontSize: parseFloat(getComputedStyle(element).fontSize) };
}), selectors);

const layouts = [
  { route: "/order", root: ".orderPage", selectors: [
    ".orderPage__stage", ".blockClothingSelector", ".clothing-block", ".image-wrapper",
    ".blockSelection", ".selectorType__item", ".colorSquare", ".sizeSelector__box", ".orderActionButton--next",
  ] },
  { route: "/embroidery", root: ".embroideryPage", selectors: [
    ".embroideryPage__stage", ".embroiderySelectorDesktop", ".embroiderySelectorDesktop__imageFrame",
    ".embroiderySelectorDesktop__panel", ".embroideryDesktopTabs button", ".embroideryDesktopChoice__radio",
    ".embroideryDesktopCounter__button", ".embroiderySelectorDesktop__navigation .is-next",
  ] },
  { route: "/recipient", root: ".recipientOrderPage", selectors: [
    ".recipientOrderPage__stage", ".recipientOrderCard", ".recipientOrderCard__imageFrame", ".recipientOrderForm",
    ".recipientOrderForm__field--fullName", ".recipientOrderForm__phoneField", ".recipientOrderForm__noMiddleName input",
    ".recipientOrderForm__consent input", ".recipientOrderForm__turnstileShield", ".recipientOrderNavigation__submit",
  ] },
  { route: "/certificate", root: ".certificatePage", selectors: [
    ".certificatePage__stage", ".certificatePage__card", ".certificatePage__title", ".certificatePage__glow",
    ".certificatePage__ticket", ".certificatePage__offer", ".certificatePage__denomination", ".certificatePage__action",
  ] },
];

for (const { mode, base, widths } of [
  { mode: "mobile", base: 320, widths: [320, 360, 390, 430, 639] },
  { mode: "tablet", base: 640, widths: [640, 768, 820, 1024, 1199] },
]) {
  test(`constructor and certificate follow the ${mode} design proportions`, async ({ page }, testInfo) => {
    test.skip(Boolean(testInfo.project.use.isMobile), "Run the full geometry matrix once");
    await page.setViewportSize({ width: base, height: 900 });
    await selectClothing(page);
    await selectEmbroidery(page);
    for (const { route, root, selectors } of layouts) {
      await page.setViewportSize({ width: base, height: 900 });
      await page.goto(route);
      await expect(page.locator(root)).toBeVisible();
      await expect(page.locator(root)).toHaveCSS("transform", "none");
      if (route === "/recipient") await expect(page.getByTestId("turnstile-panel")).toHaveClass(/is-verified/);
      await page.evaluate(() => document.fonts.ready);
      const baseline = await geometry(page, selectors);
      // The certificate checkout tail is content-driven (errors, discounts and
      // the 16px input minimum). Its containers keep their scaled width, but
      // their height must adapt instead of inheriting the old fixed canvas.
      const hasFlowHeight = (selector) => route === "/recipient" &&
        [".recipientOrderPage__stage", ".recipientOrderCard", ".recipientOrderForm"].includes(selector);
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 });
        await expect.poll(async () => (await page.locator(root).boundingBox()).width).toBeCloseTo(width, 0);
        // Legacy button transitions may still be settling after a viewport resize.
        await expect.poll(async () => {
          const current = await geometry(page, selectors);
          return Math.max(...current.flatMap((item, index) => [
            Math.abs(item.width - baseline[index].width * width / base),
            hasFlowHeight(item.selector) ? 0 : Math.abs(item.height - baseline[index].height * width / base),
          ]));
        }).toBeLessThan(0.5);
        const actual = await geometry(page, selectors);
        actual.forEach((item, index) => {
          expect(item.width, `${route} ${width}px ${item.selector} width`).toBeCloseTo(baseline[index].width * width / base, 0);
          if (!hasFlowHeight(item.selector)) expect(item.height, `${route} ${width}px ${item.selector} height`).toBeCloseTo(baseline[index].height * width / base, 0);
        });
        const bounds = await page.locator(root).boundingBox();
        expect(bounds.x, `${route} ${width}px canvas left`).toBeCloseTo(0, 0);
        expect(bounds.x + bounds.width, `${route} ${width}px canvas right`).toBeCloseTo(width, 0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
        if (mode === "mobile" && route !== "/certificate") {
          const selector = route === "/order" ? ".image-frame" : route === "/embroidery"
            ? ".embroiderySelectorDesktop__imageFrame" : ".recipientOrderCard__imageFrame";
          const image = page.locator(`${selector} img`);
          const frame = await page.locator(selector).boundingBox();
          expect(frame.width).toBeCloseTo(frame.height, 0);
          await expect(image).toHaveCSS("object-fit", "contain");
        }
      }
    }
  });
}

test("compact text fields scale above the 16px minimum and preserve their values", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.isMobile, "Use touch input typography, including the tablet range");
  await selectClothing(page);
  await page.locator(".orderActionButton--next").click();
  await page.locator(".embroideryDesktopTabs button").nth(1).click();
  const inscription = page.getByPlaceholder("Введите надпись");
  await inscription.fill("Надпись для проверки масштаба");
  for (const width of [320, 390, 639, 640, 1024, 1199]) {
    await page.setViewportSize({ width, height: 900 });
    const base = width < 640 ? 320 : 640;
    const designFont = width < 640 ? 9 : 8;
    await expect.poll(() => inscription.evaluate((element) => parseFloat(getComputedStyle(element).fontSize)))
      .toBeCloseTo(Math.max(16, designFont * width / base), 2);
    await expect(inscription).toHaveValue("Надпись для проверки масштаба");
  }
  await page.locator(".embroiderySelectorDesktop__navigation .is-next").click();
  const name = page.getByPlaceholder("ФИО", { exact: true });
  await name.fill("Иванов Иван Иванович");
  for (const width of [390, 639, 640, 1024, 1199]) {
    await page.setViewportSize({ width, height: 900 });
    const base = width < 640 ? 320 : 640;
    const designFont = width < 640 ? 10 : 8;
    await expect.poll(() => name.evaluate((element) => parseFloat(getComputedStyle(element).fontSize)))
      .toBeCloseTo(Math.max(16, designFont * width / base), 2);
    await expect(name).toHaveValue("Иванов Иван Иванович");
    const fonts = await page.locator(".recipientOrderForm input:not([type=checkbox]), .recipientOrderForm textarea")
      .evaluateAll((fields) => fields.map((element) => parseFloat(getComputedStyle(element).fontSize)));
    expect(fonts.every((size) => size >= 16)).toBe(true);
  }
  await page.goto("/certificate");
  const denomination = page.getByRole("combobox");
  await denomination.selectOption("20000");
  for (const width of [390, 639, 640, 1024, 1199]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => denomination.evaluate((element) => parseFloat(getComputedStyle(element).fontSize)))
      .toBeCloseTo(16 * width / (width < 640 ? 320 : 640), 2);
    await expect(denomination).toHaveValue("20000");
  }
});

test("order overlays keep native viewport coordinates, focus and scroll locks", async ({ page }, testInfo) => {
  test.skip(Boolean(testInfo.project.use.isMobile), "Exercise phone and tablet layouts once");
  await selectClothing(page);
  for (const width of [390, 1024]) {
    await page.setViewportSize({ width, height: 740 });
    if (width === 1024) {
      await page.goto("/order");
      const trigger = page.getByRole("button", { name: "Таблица размеров" });
      await trigger.click();
      const sizeDialog = page.getByRole("dialog", { name: "Таблица размеров" });
      await expect(sizeDialog).toBeVisible();
      await expect(page.locator(".modalClose")).toHaveCSS("width", "34px");
      await page.keyboard.press("Escape");
      await expect(sizeDialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }
    await selectEmbroidery(page);
    const examplesTrigger = page.locator(".embroideryDesktopChoice__example").first();
    await examplesTrigger.focus();
    await page.keyboard.press("Enter");
    const examples = page.getByRole("dialog", { name: "Примеры работ" });
    await expect(examples).toBeVisible();
    await expect(page.locator(".modalOverlay")).toHaveCSS("width", `${width}px`);
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
    await expect(page.locator(".modalClose")).toHaveCSS("width", "34px");
    await page.keyboard.press("Escape");
    await expect(examples).toHaveCount(0);
    await expect(examplesTrigger).toBeFocused();
    await page.goto("/recipient");
    await page.locator(".recipientOrderForm__deliveryMethod").click();
    const cdek = page.locator(".recipientCdekDialog");
    await page.getByRole("checkbox", { name: "В моём городе нет СДЭКа" }).uncheck();
    await expect(cdek).toHaveCSS("position", "fixed");
    const overlay = await cdek.boundingBox();
    expect(overlay).toMatchObject({ x: 0, y: 0, width, height: 740 });
    await page.getByRole("button", { name: "Select demo pickup point" }).click();
    await expect(cdek).not.toHaveClass(/is-open/);
    await page.locator(".recipientOrderForm__deliveryMethod").click();
    await page.getByRole("checkbox", { name: "В моём городе нет СДЭКа" }).check();
    const address = page.locator(".manualAddress__input");
    await address.fill("Красноярск, улица Ленина, дом 1");
    await expect(address).toHaveCSS("font-size", width < 640 ? "16px" : "15px");
    const surface = await page.locator(".recipientCdekDialog__surface").boundingBox();
    expect(surface.x).toBeGreaterThanOrEqual(0);
    expect(surface.y).toBeGreaterThanOrEqual(0);
    expect(surface.x + surface.width).toBeLessThanOrEqual(width + 1);
    expect(surface.y + surface.height).toBeLessThanOrEqual(741);
    await page.locator(".recipientCdekDialog__header button").click();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  }
});

test("the restored-files notice clears the scaled header and stays inside the viewport", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.isMobile, "Check the mobile fixed-position notice");
  await selectClothing(page);
  await selectEmbroidery(page);
  await page.evaluate(() => {
    const draft = JSON.parse(sessionStorage.getItem("its_order_draft_v1"));
    draft.uploadFiles = [{ name: "customer-photo.jpg", size: 1024, lastModified: Date.now() }];
    sessionStorage.setItem("its_order_draft_v1", JSON.stringify(draft));
  });
  await page.reload();
  const notice = page.locator(".embroideryRestoreNotice");
  await expect(notice).toBeVisible();
  for (const width of [320, 390, 639]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(async () => (await notice.boundingBox()).y).toBeCloseTo(68 * width / 320, 0);
    const bounds = await notice.boundingBox();
    const header = await page.locator(".home-header--standalone").boundingBox();
    expect(bounds.y).toBeGreaterThanOrEqual(header.y + header.height);
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    await expect(notice.getByRole("button", { name: "Закрыть уведомление" })).toBeInViewport();
  }
  await notice.getByRole("button", { name: "Закрыть уведомление" }).click();
  await expect(notice).toHaveCount(0);
});
