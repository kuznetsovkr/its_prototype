import { expect, test } from "@playwright/test";
import { CUSTOM_TEXT_FONT_OPTIONS } from "../src/features/order/embroidery/customTextFonts";

test.setTimeout(90_000);
const suppliedFonts = CUSTOM_TEXT_FONT_OPTIONS.filter(font => font.family.startsWith("ITS Embroidery"));

const openInscription = async (page) => {
  await page.goto("/order");
  await page.locator('.sizeSelector__item:has(input[value="M"]) .sizeSelector__box').click();
  await page.locator(".orderNavigation .orderActionButton--next").click();
  await expect(page).toHaveURL(/\/embroidery$/);
  await page.getByRole("button", { name: "надпись", exact: true }).click();
};

for (const viewport of [
  { name: "desktop", width: 1440, height: 900, project: "desktop-chromium" },
  { name: "tablet", width: 1024, height: 768, project: "desktop-chromium" },
  { name: "tablet-touch", width: 1024, height: 768, project: "mobile-chromium" },
  { name: "mobile", width: 390, height: 844, project: "mobile-chromium" },
]) {
  test(`все присланные шрифты загружаются и сохраняют выбор: ${viewport.name}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== viewport.project, "Соответствующий режим ввода");
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const fontRequests = [];
    page.on("request", request => { if (request.url().endsWith(".woff")) fontRequests.push(request.url()); });
    await page.goto("/");
    await expect(page.locator(".home-hero")).toBeVisible({ timeout: 20_000 });
    await page.evaluate(() => document.fonts.ready);
    expect(fontRequests).toHaveLength(0);
    await openInscription(page);
    const text = page.getByRole("textbox", { name: "Текст для вышивки", exact: true });
    const select = page.getByRole("combobox", { name: "Шрифт", exact: true });
    await expect(select.locator("option")).toHaveCount(8);
    expect(await select.locator("option").evaluateAll(options => options.map(option => option.value))).toEqual(suppliedFonts.map(font => font.value));
    await expect(select).toHaveValue("Onest Bold");
    await expect(page.getByText(/Черновик сохраняется в этом браузере|Фото нужно выбрать заново после закрытия страницы/)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Удалить черновик", exact: true })).toHaveCount(0);
    await expect(page.locator(".orderDraftNotice")).toHaveCount(0);
    for (const field of [text, select, page.getByRole("textbox", { name: "Комментарий", exact: true })]) {
      expect(await field.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
    }
    expect(await text.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(18);
    for (const label of await page.locator(".embroideryDesktopDetails--text .embroideryDesktopDetails__field > span").all()) {
      expect(await label.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14);
    }
    expect(await select.evaluate(element => parseFloat(getComputedStyle(element).borderTopLeftRadius))).toBeGreaterThanOrEqual(20);
    await text.focus();
    await page.keyboard.press("Tab");
    await expect(select).toBeFocused();
    await expect(select).toHaveCSS("outline-style", "solid");
    if (await page.evaluate(() => CSS.supports("appearance", "base-select"))) {
      await select.click();
      await expect.poll(() => select.evaluate(element => element.matches(":open"))).toBe(true);
      expect(await select.evaluate(element => getComputedStyle(element, "::picker(select)").borderTopLeftRadius)).toBe("20px");
      await page.getByRole("option", { name: "Book Antiqua", exact: true }).click();
      await expect(select).toHaveValue("Book Antiqua");
      await select.click(); await select.press("Escape");
      await expect.poll(() => select.evaluate(element => element.matches(":open"))).toBe(false);
    }
    for (const font of suppliedFonts) {
      const sample = font.cyrillic === false ? "Love 2026" : "Привет, Ёжик! Love 2026";
      await text.fill(sample);
      await select.selectOption(font.value);
      const faces = await page.evaluate(async ({ family, weight = 400, style = "normal", sample }) => {
        const loaded = await document.fonts.load(`${style} ${weight} 16px "${family}"`, sample);
        return loaded.map(face => ({ status: face.status, family: face.family }));
      }, { ...font, sample });
      expect(faces, font.value).toHaveLength(1);
      expect(faces[0].status, font.value).toBe("loaded");
      await expect(text).toHaveCSS("font-weight", String(font.weight || 400));
      await expect(text).toHaveCSS("font-style", font.style || "normal");
      expect(await text.evaluate(element => getComputedStyle(element).fontFamily)).toContain(font.family);
      await expect(page.locator("#embroidery-font-error")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
      if (viewport.width < 640 || testInfo.project.use.isMobile) {
        expect(await text.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
      }
    }
    expect(new Set(fontRequests).size).toBe(8);
    await expect(select).toHaveValue("Vasek Italic");
    const [commentBox, priceBox, panelBox, nextBox] = await Promise.all([
      page.getByRole("textbox", { name: "Комментарий", exact: true }).boundingBox(),
      page.locator(".embroiderySelectorDesktop__price").boundingBox(),
      page.locator(".embroiderySelectorDesktop__panel").boundingBox(),
      page.locator(".embroiderySelectorDesktop__navigation .is-next").boundingBox(),
    ]);
    expect(priceBox.y).toBeGreaterThanOrEqual(commentBox.y + commentBox.height);
    expect(nextBox.y).toBeGreaterThanOrEqual(panelBox.y + panelBox.height);
    await text.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath("inscription-preview.png") });
    await page.reload();
    await expect(text).toHaveValue("Привет, Ёжик! Love 2026");
    await expect(select).toHaveValue("Vasek Italic");
    await expect(text).toHaveCSS("font-style", "italic");
    await page.locator(".embroiderySelectorDesktop__navigation .is-next").click();
    await expect(page).toHaveURL(/\/recipient$/);
    await page.goBack();
    await expect(select).toHaveValue("Vasek Italic");
    await expect(text).toHaveValue("Привет, Ёжик! Love 2026");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  });
}

test("кириллица не подменяется незаметно другим шрифтом в Swanky and Moo Moo", async ({ page }) => {
  await openInscription(page);
  const text = page.getByRole("textbox", { name: "Текст для вышивки", exact: true });
  const select = page.getByRole("combobox", { name: "Шрифт", exact: true });
  const next = page.locator(".embroiderySelectorDesktop__navigation .is-next");
  await select.selectOption("Swanky and Moo Moo");
  await text.fill("Моя собака");
  await expect(page.getByRole("alert")).toContainText("не поддерживает кириллицу");
  await expect(text).toHaveAttribute("aria-invalid", "true");
  await expect(next).toBeDisabled();
  await text.fill("My dog");
  await expect(page.locator("#embroidery-font-error")).toHaveCount(0);
  await expect(next).toBeEnabled();
  await text.fill("Моя собака");
  await select.selectOption("Lumios Marker");
  await expect(text).toHaveValue("Моя собака");
  await expect(page.locator("#embroidery-font-error")).toHaveCount(0);
  await expect(next).toBeEnabled();
});

test("старый шрифт в черновике заменяется доступным без потери текста", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("its_order_draft_v1", JSON.stringify({ version: 1, uploadFiles: [], order: {
    clothing: { type: "Hoodie", color: "Чёрный", size: "M" },
    embroidery: { type: "custom", typeSelectionExplicit: true, customOption: { image: false, text: true },
      customText: "Сохранённая надпись", customTextFont: "Arial" },
  } })));
  await page.goto("/embroidery");
  await expect(page.getByRole("textbox", { name: "Текст для вышивки", exact: true })).toHaveValue("Сохранённая надпись");
  await expect(page.getByRole("combobox", { name: "Шрифт", exact: true })).toHaveValue("Onest Bold");
  await expect(page.getByRole("combobox", { name: "Шрифт", exact: true }).locator('option[value="Arial"]')).toHaveCount(0);
});
