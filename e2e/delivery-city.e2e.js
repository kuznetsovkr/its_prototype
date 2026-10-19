import { expect, test } from "@playwright/test";

test.setTimeout(90_000);
test.beforeEach(async ({ page }, info) => {
  test.skip(!info.project.name.endsWith("live-checkout"), "Run with test:e2e:completion: verify real order screens, not demo defaults");
  await page.route("**/api/**", route => route.abort());
  await page.route("**/service.php**", route => route.abort());
});
const cities = {
  krs: { id: "11111111-1111-4111-8111-111111111111", name: "Красноярск", label: "Красноярский край, г Красноярск", longitude: 92.868, latitude: 56.0106, pickup: true },
  msk: { id: "22222222-2222-4222-8222-222222222222", name: "Москва", label: "г Москва", longitude: 37.62, latitude: 55.75, pickup: false },
};
const selected = city => ({ ...city, token: "fixture-city-" + city.id, expiresAt: Date.now() + 86400000 });
const upload = async page => {
  await page.getByRole("button", { name: "далее", exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: "car.png", mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aHy4AAAAASUVORK5CYII=", "base64") });
  await page.getByRole("button", { name: "далее", exact: true }).click();
  await expect(page).toHaveURL(/\/recipient$/);
};
const prepare = async (page, { failSuggestions = false, slowOffice = false } = {}) => {
  const calls = { suggest: [], quotes: [], orders: [] };
  await page.addInitScript(() => {
    if (sessionStorage.getItem("its_order_draft_v1")) return;
    sessionStorage.setItem("its_order_draft_v1", JSON.stringify({ version: 1, uploadFiles: [], order: {
      clothing: { type: "Hoodie", color: "Чёрный", size: "M", previewAlt: "Худи" },
      embroidery: { type: "Car", carDesign: "medium", typeSelectionExplicit: true, uploadedImage: [] },
      recipient: { userData: { firstName: "Иван", lastName: "Иванов", middleName: "", phone: "+7 (999) 123-45-67" }, hasNoMiddleName: true, privacyConsent: true },
    } }));
  });
  await page.route("**/api/public-config", route => route.fulfill({ json: { turnstile: { enabled: false } } }));
  await page.route("**/api/pricing/quote", route => route.fulfill({ json: { prices: { Car: 6500, Patronus: 15000, petFace: 8000 }, carDesignPrices: { simple: 6500, medium: 8500, complex: 11500 } } }));
  await page.route("**/api/pricing/checkout", route => {
    calls.quotes.push(route.request().postDataJSON());
    return route.fulfill({ json: { merchandisePrice: 8500, deliveryPrice: 742, totalPrice: 9242, paymentAmount: 9242 } });
  });
  await page.route("**/api/delivery/cities/suggest", route => {
    const { query } = route.request().postDataJSON(); calls.suggest.push(query);
    const city = query.toLowerCase().startsWith("мос") ? cities.msk : cities.krs;
    return route.fulfill(failSuggestions ? { status: 503, json: { message: "Сервис подсказок временно недоступен" } }
      : { json: { suggestions: [city] } });
  });
  await page.route("**/api/delivery/cities/resolve", route => {
    const { id } = route.request().postDataJSON();
    return route.fulfill({ json: { city: selected(Object.values(cities).find(city => city.id === id)) } });
  });
  await page.route("**/api/delivery/cities/office", async route => {
    if (slowOffice) await new Promise(resolve => setTimeout(resolve, 1000));
    const { officeCode } = route.request().postDataJSON();
    return route.fulfill({ json: { city: selected(officeCode === "MSK1" ? cities.msk : cities.krs) } });
  });
  // Stand in for the external SDK only; exercise the real recipient component,
  // callbacks, city API, initial-location prop and order validation.
  await page.route(/\/assets\/MyCdekWidget-[^/]+\.js$/, route => route.fulfill({ contentType: "application/javascript", body: `
    export default function Widget(props) { window.cityMapLocation = props.initialLocation;
      window.chooseCityOffice = payload => props.onCdekSelect(payload); return null; }
  ` }));
  await page.route("**/api/orders/create", route => { calls.orders.push(route.request().postData()); return route.abort(); });
  await page.goto("/embroidery"); await upload(page);
  return calls;
};
const chooseCity = async (page, city, query = city.name) => {
  const input = page.getByRole("combobox", { name: "Город получения" });
  await input.fill(query);
  await expect(page.getByRole("option", { name: city.label, exact: true })).toBeVisible();
  await input.press("ArrowDown"); await input.press("Enter");
  await expect(input).toHaveValue(city.label);
};
const chooseOffice = async (page, officeCode) => {
  await page.getByRole("button", { name: /Выберите пункт получения СДЭК|Выбран пункт получения:/ }).click();
  await expect.poll(() => page.evaluate(() => Array.isArray(window.cityMapLocation))).toBe(true);
  const location = await page.evaluate(() => window.cityMapLocation);
  await page.evaluate(code => window.chooseCityOffice({ mode: "office", tariff: { delivery_sum: 742 },
    address: { code }, addressLabel: "ПВЗ " + code }), officeCode);
  await expect(page.getByText("Проверяем город выбранного ПВЗ…")).toHaveCount(0);
  return location;
};

test("город выбирается только из подсказок, самовывоз доступен для Красноярска и выбор сохраняется", async ({ page }, info) => {
  const calls = await prepare(page);
  const input = page.getByRole("combobox", { name: "Город получения" });
  await expect(input).toHaveValue("");
  await expect(page.getByRole("radio", { name: "СДЭК", exact: true })).toBeDisabled();
  await expect(page.getByRole("radio", { name: "Самовывоз", exact: true })).toHaveCount(0);
  await input.fill("Несуществующий ввод");
  await expect(page.getByRole("radio", { name: "СДЭК", exact: true })).toBeDisabled();
  await chooseCity(page, cities.krs, "Красноярк");
  await expect(page.getByRole("radio", { name: "Самовывоз", exact: true })).toBeEnabled();
  await page.getByRole("radio", { name: "Самовывоз", exact: true }).check();
  await expect(page.getByRole("button", { name: "отправить заявку", exact: true })).toBeEnabled();
  await chooseCity(page, cities.msk);
  await expect(page.getByRole("radio", { name: "Самовывоз", exact: true })).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "СДЭК", exact: true })).toBeChecked();
  await expect(page.locator(".recipientOrderNavigation__submit")).toBeDisabled();
  await page.screenshot({ path: info.outputPath("delivery-city.png"), fullPage: true });
  if (info.project.name.startsWith("mobile")) expect(await input.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.reload(); await upload(page);
  await expect(input).toHaveValue(cities.msk.label);
  expect(calls.orders).toHaveLength(0);
});

test("карта открывается на выбранном городе, другой ПВЗ синхронизирует город, редактирование сбрасывает расчёт", async ({ page }) => {
  const calls = await prepare(page);
  await chooseCity(page, cities.msk);
  expect(await chooseOffice(page, "KRS1")).toEqual([37.62, 55.75]);
  await expect(page.getByRole("combobox", { name: "Город получения" })).toHaveValue(cities.krs.label);
  await expect(page.getByText(/Город получения изменён на «Красноярск»/)).toBeVisible();
  await expect(page.locator(".recipientOrderSummary")).toContainText(/9\s*242/);
  await expect(page.locator(".recipientOrderNavigation__submit")).toBeEnabled();
  await page.getByRole("combobox", { name: "Город получения" }).fill("Мос");
  await expect(page.locator(".recipientOrderNavigation__submit")).toBeDisabled();
  await expect(page.locator(".recipientOrderSummary")).not.toContainText(/9\s*242/);
  await expect(page.getByRole("button", { name: "Выберите пункт получения СДЭК", exact: true })).toBeDisabled();
  await chooseCity(page, cities.msk);
  await expect(page.getByRole("button", { name: "Выберите пункт получения СДЭК", exact: true })).toBeEnabled();
  expect(calls.quotes).toHaveLength(1); expect(calls.orders).toHaveLength(0);
});

test("недоступные подсказки показывают ошибку и не принимают произвольный город", async ({ page }) => {
  await prepare(page, { failSuggestions: true });
  await page.getByRole("combobox", { name: "Город получения" }).fill("Москва");
  await expect(page.getByRole("status").filter({ hasText: "Сервис подсказок временно недоступен" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "СДЭК", exact: true })).toBeDisabled();
  await expect(page.locator(".recipientOrderNavigation__submit")).toBeDisabled();
});

test("запоздавший ответ о городе ПВЗ не перезаписывает новый выбор города", async ({ page }) => {
  await prepare(page, { slowOffice: true });
  await chooseCity(page, cities.msk);
  await page.getByRole("button", { name: "Выберите пункт получения СДЭК", exact: true }).click();
  await expect.poll(() => page.evaluate(() => typeof window.chooseCityOffice)).toBe("function");
  await page.evaluate(() => { window.chooseCityOffice({ mode: "office", tariff: { delivery_sum: 742 }, address: { code: "KRS1" }, addressLabel: "ПВЗ KRS1" }); });
  await expect(page.getByText("Проверяем город выбранного ПВЗ…")).toBeVisible();
  await chooseCity(page, cities.msk, "Мос");
  await page.waitForTimeout(1100);
  await expect(page.getByRole("combobox", { name: "Город получения" })).toHaveValue(cities.msk.label);
  await expect(page.getByText(/Город получения изменён на/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Выберите пункт получения СДЭК", exact: true })).toBeEnabled();
  await expect(page.locator(".recipientOrderNavigation__submit")).toBeDisabled();
});
