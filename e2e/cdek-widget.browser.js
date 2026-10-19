/* global window */
import { expect, test } from "@playwright/test";
test("карта использует серверный единый пакет и полный тариф; изменение состава обновляет расчёт", async ({ page }) => {
  const calls = [];
  await page.route("**/api/**", route => route.abort());
  await page.route("**/api/public-config", route => route.fulfill({ json: { cdek: {
    tariffCode: 136, defaultLocation: [92.868, 56.01], defaultZoom: 10, from: { code: 278 },
  } } }));
  await page.route("**/api/pricing/shipping-context", route => {
    const { items } = route.request().postDataJSON(); calls.push(items);
    return route.fulfill({ json: { token: "fixture-context-" + items.length, packages: [{ length: 35, width: 35, height: items.length === 2 ? 10 : 7, weight: items.length === 2 ? 1100 : 800 }] } });
  });
  await page.route(/\/node_modules\/\.vite\/deps\/@cdek-it_widget\.js(?:\?.*)?$/, route => route.fulfill({
    contentType: "application/javascript", body: `export default class Widget {
      constructor(options) { window.cdekOptions = options; }
      updateLocation() { return Promise.resolve(); }
      destroy() { window.cdekDestroyed = (window.cdekDestroyed || 0) + 1; }
    }`,
  }));
  await page.goto("/e2e/fixtures/cdek-widget.html");
  await expect.poll(() => page.evaluate(() => window.cdekOptions?.goods)).toEqual([{ length: 35, width: 35, height: 10, weight: 1.1 }]);
  expect(await page.evaluate(() => window.cdekOptions.servicePath)).toContain("shippingContext=fixture-context-2");
  await page.evaluate(() => window.cdekOptions.onChoose("office", { tariff_code: 136, delivery_sum: 380, total_sum: 477.75 }, { code: "KRS1", address: "ПВЗ" }));
  await expect(page.getByLabel("Стоимость")).toHaveText("477.75");
  await page.getByRole("button", { name: "Изменить состав" }).click();
  await expect.poll(() => page.evaluate(() => window.cdekOptions?.goods)).toEqual([{ length: 35, width: 35, height: 7, weight: .8 }]);
  expect(await page.evaluate(() => window.cdekOptions.servicePath)).toContain("shippingContext=fixture-context-1");
  expect(calls.map(items => items.length)).toEqual([2, 1]);
  expect(calls.flat().every(item => !item.price && !item.certificateCode && !item.phone && !item.attachments)).toBe(true);
});
test("ошибка подготовки расчёта не запускает карту со старыми ценами; повторное открытие восстанавливает работу", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/public-config", route => route.fulfill({ json: { cdek: { tariffCode: 136, defaultLocation: [92.868, 56.01], defaultZoom: 10, from: { code: 278 } } } }));
  await page.route("**/api/pricing/shipping-context", route => route.fulfill(++requests === 1
    ? { status: 503, json: { message: "Тестовый сбой" } }
    : { json: { token: "fixture-retry", packages: [{ length: 35, width: 35, height: 10, weight: 1100 }] } }));
  await page.route(/\/node_modules\/\.vite\/deps\/@cdek-it_widget\.js(?:\?.*)?$/, route => route.fulfill({ contentType: "application/javascript",
    body: "export default class Widget { constructor(options) { window.cdekOptions = options; } updateLocation() { return Promise.resolve(); } destroy() {} }" }));
  await page.goto("/e2e/fixtures/cdek-widget.html");
  await expect(page.getByText("Не удалось подготовить расчёт СДЭК. Закройте карту и попробуйте снова.")).toBeVisible();
  expect(await page.evaluate(() => window.cdekOptions)).toBeUndefined();
  await page.getByRole("button", { name: "Открыть / закрыть" }).click(); await page.getByRole("button", { name: "Открыть / закрыть" }).click();
  await expect.poll(() => page.evaluate(() => window.cdekOptions?.servicePath)).toContain("shippingContext=fixture-retry");
});
