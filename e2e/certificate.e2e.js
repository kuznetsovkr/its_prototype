import { expect, test } from "@playwright/test";

const denominations = [
  1000, 2000, 3000, 4000, 5000, 6000, 8000,
  10000, 12000, 14000, 16000, 18000, 20000,
];

test("сертификат предлагает согласованные номиналы и обновляет сумму", async ({ page }, testInfo) => {
  await page.goto("/certificate");

  const select = page.getByRole("combobox", { name: "Номинал" });
  const amount = page.locator(".certificatePage__amount");
  const action = page.getByRole("button", { name: "Подарить сертификат" });

  await expect(select).toHaveValue("1000");
  await expect(amount).toHaveText(/1\s*000 ₽/);
  expect(await select.locator("option").evaluateAll((options) =>
    options.map((option) => Number(option.value)))).toEqual(denominations);

  await select.selectOption("2000");
  await expect(amount).toHaveText(/2\s*000 ₽/);
  await select.selectOption("20000");
  await expect(amount).toHaveText(/20\s*000 ₽/);
  await expect(action).toBeEnabled();

  if (testInfo.project.name === "desktop-chromium") {
    await page.setViewportSize({ width: 820, height: 1180 });
  }
  const selectBox = await select.boundingBox();
  const actionBox = await action.boundingBox();
  expect(selectBox.y + selectBox.height).toBeLessThan(actionBox.y);
  if (testInfo.project.name === "mobile-chromium") {
    expect(await select.evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
  }
});

const setupCertificateApi = async (page, { enabled = false } = {}) => {
  const purchases = [];
  const payments = [];
  const receipt = { paid: false, certificateId: 42, nominalKopecks: 200000, paymentAmountKopecks: 100, testMode: true, emailDelivery: "pending", expiresAt: null };
  await page.route("**/certificates/config", (route) => route.fulfill({ json: { enabled, denominations, testMode: true, turnstile: { enabled: false } } }));
  await page.route("**/certificates/purchase", async (route) => {
    purchases.push({ body: route.request().postDataJSON(), key: route.request().headers()["idempotency-key"] });
    await route.fulfill({ status: 201, json: { certificateId: 42, certificateToken: "fixture-buyer-token", nominalKopecks: 200000, paymentAmountKopecks: 100, testMode: true } });
  });
  await page.route("**/certificates/42/payment", async (route) => {
    payments.push(route.request().headers()["x-certificate-access-token"]);
    await route.fulfill({ json: { pay_url: "https://paykeeper.example/bill/fixture/", paymentAmountKopecks: 100, testMode: true } });
  });
  await page.route("**/certificates/42/status", (route) => route.fulfill({ json: { ...receipt } }));
  await page.route("https://paykeeper.example/**", (route) => route.fulfill({ body: "<html><body>Mock payment page — no charge</body></html>", contentType: "text/html" }));
  return { purchases, payments, receipt };
};
const openCertificateForm = async (page) => {
  await page.goto("/certificate");
  await page.getByRole("combobox", { name: "Номинал" }).selectOption("2000");
  await page.getByRole("button", { name: "Подарить сертификат" }).click();
  await expect(page.getByRole("heading", { name: "Введите свои данные" })).toBeVisible();
};
const fillBuyer = async (page) => {
  await page.getByRole("textbox", { name: "ФИО", exact: true }).fill("Иванов Иван");
  await page.getByRole("textbox", { name: "Номер телефона", exact: true }).fill("89991234567");
  await page.getByRole("textbox", { name: "E-mail", exact: true }).fill("buyer@example.com");
  await page.getByRole("checkbox").check();
};

test("форма сертификата адаптивна, использует локальные ассеты и не принимает оплату без почты", async ({ page }, testInfo) => {
  const api = await setupCertificateApi(page);
  await openCertificateForm(page);
  await fillBuyer(page);
  await expect(page.getByRole("button", { name: "к оплате", exact: true })).toBeDisabled();
  await expect(page.getByText(/Оплата будет доступна после настройки/)).toBeVisible();
  await expect(page.getByText("Доставка", { exact: true })).toHaveCount(0);
  expect(api.purchases).toHaveLength(0);
  const assets = await page.locator(".certificateCheckout__back img, .certificateCheckout__preview img").evaluateAll((images) => images.map((image) => ({
    loaded: image.complete && image.naturalWidth > 0,
    local: !image.currentSrc.includes("figma.com"),
    width: image.getBoundingClientRect().width, height: image.getBoundingClientRect().height,
  })));
  expect(assets).toHaveLength(3);
  for (const asset of assets) expect(asset.loaded && asset.local && asset.width > 0 && asset.height > 0).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  if (testInfo.project.name === "mobile-chromium") {
    for (const field of await page.locator(".certificateCheckout input:not([type=checkbox]), .certificateCheckout textarea").all()) {
      expect(await field.evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
    }
    const button = await page.locator(".certificateCheckout__submit").boundingBox();
    const controls = await page.locator(".certificateCheckout__controls").boundingBox();
    expect(button.width / controls.width).toBeGreaterThan(0.85);
    expect(Math.abs(button.x + button.width / 2 - controls.x - controls.width / 2)).toBeLessThan(1);
  }
  await page.screenshot({ path: testInfo.outputPath("certificate-checkout.png"), fullPage: true });
  await page.getByRole("button", { name: "Вернуться к номиналам" }).click();
  await expect(page.getByRole("combobox", { name: "Номинал" })).toHaveValue("2000");
});

test("сертификат проверяет поля, создаёт одну покупку и ждёт серверного подтверждения", async ({ page }) => {
  const api = await setupCertificateApi(page, { enabled: true });
  await openCertificateForm(page);
  const pay = page.getByRole("button", { name: "к оплате", exact: true });
  await expect(pay).toBeEnabled();
  await pay.click();
  await expect(page.getByRole("alert")).toHaveText(/фамилию и имя/);
  expect(api.purchases).toHaveLength(0);
  await fillBuyer(page);
  await pay.click();
  await expect(page).toHaveURL("https://paykeeper.example/bill/fixture/");
  expect(api.purchases).toHaveLength(1);
  expect(api.purchases[0].body.denomination).toBe(2000);
  expect(api.purchases[0].key).toMatch(/^[a-f0-9-]{36}$/);
  expect(api.payments).toEqual(["fixture-buyer-token"]);
  await page.goto("/payment-success");
  await expect(page).toHaveURL(/\/certificate\?payment=return/);
  await expect(page.getByRole("heading", { name: "Проверяем оплату" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Спасибо за покупку!" })).toHaveCount(0);
  api.receipt.paid = true; api.receipt.emailDelivery = "sent"; api.receipt.expiresAt = "2027-10-04T12:00:00Z";
  await expect(page.getByRole("heading", { name: "Спасибо за покупку!" })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(/Письмо с кодом отправлено/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Спасибо за покупку!" })).toBeVisible();
  expect(api.purchases).toHaveLength(1);
});

test("ошибка получения ссылки позволяет повторить оплату без новой покупки", async ({ page }) => {
  const api = await setupCertificateApi(page, { enabled: true });
  let attempts = 0;
  await page.route("**/certificates/42/payment", (route) => {
    attempts += 1;
    return route.fulfill({ status: 502, json: { message: "Платёжный сервис временно недоступен" } });
  });
  await openCertificateForm(page);
  await fillBuyer(page);
  await page.getByRole("button", { name: "к оплате", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(/Платёжный сервис/);
  await page.getByRole("button", { name: "к оплате", exact: true }).click();
  await expect.poll(() => attempts).toBe(2);
  expect(api.purchases).toHaveLength(1);
  await expect(page.getByRole("textbox", { name: "E-mail", exact: true })).toBeDisabled();
});
