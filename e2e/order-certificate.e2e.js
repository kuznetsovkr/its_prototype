import { expect, test } from "@playwright/test";

const code = "ITS" + "A1".repeat(16);
test.setTimeout(60_000);
const seedOrder = async (page) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("its_order_draft_v1")) return;
    sessionStorage.setItem("its_order_draft_v1", JSON.stringify({ version: 1, uploadFiles: [], order: {
      clothing: { type: "T-shirt", color: "Чёрный", size: "M" },
      embroidery: { type: "Car", typeSelectionExplicit: true, uploadedImage: [], patronusCount: 1, petFaceCount: 1 },
      recipient: { userData: { firstName: "Иван", lastName: "Иванов", middleName: "", phone: "+7 (999) 123-45-67" },
        hasNoMiddleName: true, privacyConsent: true, pickupPoint: "ПВЗ Красноярск", cdek: { mode: "office", address: { code: "KRS1" } } },
    } }));
  });
  await page.route("**/api/public-config", (route) => route.fulfill({ json: { turnstile: { enabled: false } } }));
};
const prepare = async (page, { free = false, invalid = false, failedLink = false } = {}) => {
  await seedOrder(page);
  const quotes = [], creates = [], completions = [], links = [];
  const quote = { merchandisePrice: 6000, deliveryPrice: free ? 0 : 390, totalPrice: free ? 6000 : 6390,
    certificateDiscount: 6000, amountDue: free ? 0 : 390, requiresBankPayment: !free,
    paymentAmount: free ? 0 : 390, paymentTestMode: false, certificate: { discount: 6000, remaining: 1000 } };
  await page.route("**/api/pricing/checkout", (route) => {
    quotes.push(route.request().postDataJSON());
    return route.fulfill(invalid ? { status: 409, json: { message: "Срок действия сертификата истёк" } } : { json: quote });
  });
  await page.route("**/api/orders/create", (route) => {
    creates.push(route.request().postData());
    return route.fulfill({ json: { ...quote, orderId: 42, orderToken: "fixture-order-token", pricePending: false } });
  });
  await page.route("**/api/orders/42/complete-certificate", (route) => {
    completions.push(route.request().headers()["x-order-access-token"]);
    return route.fulfill({ json: { ok: true, orderId: 42 } });
  });
  await page.route("**/api/payments/paykeeper/link", (route) => {
    links.push(route.request().postDataJSON());
    return route.fulfill(failedLink ? { status: 502, json: { message: "Тестовый сбой оплаты" } } : { json: { pay_url: "https://paykeeper.example/order-fixture" } });
  });
  await page.route("https://paykeeper.example/**", (route) => route.fulfill({ contentType: "text/html", body: "<html><body>Test gateway — no charge</body></html>" }));
  await page.goto("/recipient");
  await expect(page.getByRole("heading", { name: "Введите свои данные" })).toBeVisible();
  return { quotes, creates, completions, links };
};
const apply = async (page) => {
  await page.getByRole("textbox", { name: "Промокод", exact: true }).fill(code);
  await page.getByRole("button", { name: "Применить", exact: true }).click();
};

test("сертификат применяется, удаляется и не перекрывает согласие на любых ширинах", async ({ page }, info) => {
  const api = await prepare(page);
  await apply(page);
  await expect(page.locator(".recipientOrderSummary")).toContainText(/Сертификат: −6\s*000 ₽/);
  await expect(page.locator(".recipientOrderSummary")).toContainText("К оплате: 390 ₽");
  await expect(page.locator(".recipientOrderSummary")).toContainText(/Останется на сертификате: 1\s*000 ₽/);
  expect(api.quotes[0].certificateCode).toBe(code);
  for (const width of info.project.name === "desktop-chromium" ? [1440, 820] : [320, 390, 428]) {
    await page.setViewportSize({ width, height: 950 });
    const [comment, input, summary, consent, submit, cart, form, card] = await Promise.all([
      page.locator(".recipientOrderForm__group--deliveryComment").boundingBox(),
      page.locator(".orderCertificate").boundingBox(), page.locator(".recipientOrderSummary").boundingBox(),
      page.locator(".recipientOrderForm__consent").boundingBox(), page.locator(".recipientOrderNavigation__submit").boundingBox(),
      page.getByRole("button", { name: "Добавить в корзину", exact: true }).boundingBox(),
      page.locator(".recipientOrderForm").boundingBox(), page.locator(".recipientOrderCard").boundingBox(),
    ]);
    expect(input.y).toBeGreaterThanOrEqual(comment.y + comment.height);
    expect(summary.y).toBeGreaterThanOrEqual(input.y + input.height);
    expect(consent.y).toBeGreaterThanOrEqual(summary.y + summary.height);
    expect(form.y + form.height).toBeGreaterThanOrEqual(consent.y + consent.height);
    expect(submit.y).toBeGreaterThanOrEqual(form.y + form.height);
    expect(card.y + card.height + 1).toBeGreaterThanOrEqual(submit.y + submit.height);
    expect(cart.y).toBeGreaterThanOrEqual(form.y + form.height);
    expect(card.y + card.height + 1).toBeGreaterThanOrEqual(cart.y + cart.height);
    if (width < 640) {
      expect(cart.y).toBeGreaterThanOrEqual(submit.y + submit.height);
      expect(Math.abs(cart.x - submit.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(cart.width - submit.width)).toBeLessThanOrEqual(1);
    } else {
      expect(Math.abs(cart.y - submit.y)).toBeLessThanOrEqual(1);
      expect(cart.x + cart.width).toBeLessThanOrEqual(submit.x);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    if (width < 1280) expect(await page.locator("#order-certificate-code").evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
    await page.screenshot({ path: info.outputPath(`certificate-order-${width}.png`), fullPage: true });
  }
  await page.screenshot({ path: info.outputPath("certificate-order.png"), fullPage: true });
  await page.getByRole("button", { name: "Удалить", exact: true }).click();
  await expect(page.locator("#order-certificate-code")).toHaveValue("");
  await expect(page.locator(".recipientOrderSummary")).not.toContainText("Сертификат:");
});
test("кнопка корзины пока неактивна и не очищает заказ, возврат остаётся сверху", async ({ page }) => {
  const api = await prepare(page);
  await apply(page);
  await expect(page.locator(".recipientOrderSummary")).toContainText("К оплате: 390 ₽");
  const cart = page.getByRole("button", { name: "Добавить в корзину", exact: true });
  await expect(cart).toBeVisible();
  await expect(cart).toBeDisabled();
  await expect(cart).toHaveAccessibleDescription("Корзина пока недоступна");
  await expect(page.getByRole("button", { name: "Вернуться назад", exact: true })).toBeEnabled();
  const draft = await page.evaluate(() => sessionStorage.getItem("its_order_draft_v1"));
  await cart.evaluate((button) => button.click());
  await expect(page).toHaveURL(/\/recipient$/);
  expect(await page.evaluate(() => sessionStorage.getItem("its_order_draft_v1"))).toBe(draft);
  expect(api.creates).toHaveLength(0);
  expect(api.links).toHaveLength(0);
  expect(api.completions).toHaveLength(0);
  await expect(page.locator(".recipientOrderNavigation__submit")).toHaveText("к оплате");
});
test("некорректный или истёкший код не позволяет оплатить заказ", async ({ page }) => {
  await prepare(page, { invalid: true });
  await page.locator("#order-certificate-code").fill("123");
  await page.getByRole("button", { name: "Применить", exact: true }).click();
  await expect(page.getByText("Проверьте код сертификата из письма")).toBeVisible();
  await expect(page.locator(".recipientOrderNavigation__submit")).toBeDisabled();
  await apply(page);
  await expect(page.getByText("Срок действия сертификата истёк")).toBeVisible();
  await expect(page.locator(".recipientOrderNavigation__submit")).toBeDisabled();
});
test("заказ с нулевой доплатой подтверждается без перехода в банк", async ({ page }) => {
  const api = await prepare(page, { free: true });
  await apply(page);
  await page.getByRole("button", { name: "оформить заказ", exact: true }).click();
  await expect(page).toHaveURL(/\/thank-you$/);
  expect(api.creates).toHaveLength(1);
  expect(api.creates[0]).toContain(code);
  expect(api.completions).toEqual(["fixture-order-token"]);
  expect(api.links).toHaveLength(0);
});
test("повтор оплаты после обновления страницы использует тот же заказ и резерв", async ({ page }) => {
  const api = await prepare(page, { failedLink: true });
  await apply(page);
  const submit = page.locator(".recipientOrderNavigation__submit");
  await submit.click();
  await expect(page.getByText(/Заказ уже сохранён/)).toBeVisible();
  await page.reload();
  await expect(page.locator("#order-certificate-code")).toBeDisabled();
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.getByText(/Заказ уже сохранён/)).toBeVisible();
  expect(api.creates).toHaveLength(1);
  expect(api.links).toEqual([{ orderId: 42 }, { orderId: 42 }]);
});
test("полученная оплата с проблемой сертификата явно требует ручной проверки", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("pay_order_id", "42");
    sessionStorage.setItem("order_access:42", "fixture-order-token");
  });
  await page.route("**/api/orders/42", (route) => route.fulfill({ json: { paymentStatus: "review", requiresReview: true } }));
  await page.goto("/payment-success");
  await expect(page.getByText(/Не оплачивайте его повторно/)).toBeVisible();
  await expect(page).not.toHaveURL(/thank-you/);
});

test("админка показывает баланс и историю без раскрытия кода сертификата", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("token", "fixture-admin-token"));
  await page.route("**/api/auth/admin-session", (route) => route.fulfill({ json: { role: "admin" } }));
  await page.route("**/api/inventory", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/colors", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/clothing-types", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/pricing/config", (route) => route.fulfill({ json: { clothingTypes: [], additional: {} } }));
  await page.route("**/api/admin/certificates?*", (route) => route.fulfill({ json: { items: [{ id: 42, owner: "Иванов Иван", email: "buyer@example.com", nominal: 6000, balance: 1000, reserved: 0,
    statusLabel: "Активен", expiresAt: "2027-10-04T00:00:00Z", emailDelivery: "sent" }], page: 1, pageSize: 25, total: 1 } }));
  await page.route("**/api/admin/certificates/42/history?*", (route) => route.fulfill({ json: { items: [{ id: 1, type: "debit", orderId: 71, amount: -5000, balanceAfter: 1000, createdAt: "2026-10-04T00:00:00Z" }], page: 1, pageSize: 25, total: 1 } }));
  await page.goto("/admin/inventory");
  const panel = page.getByRole("region", { name: "Сертификаты", exact: true });
  await expect(panel.getByText("Активен", { exact: true })).toBeVisible();
  await expect(panel.getByText(/1\s*000 ₽/).first()).toBeVisible();
  await panel.getByRole("button", { name: "История сертификата #42" }).click();
  await expect(panel.getByText(/Заказ #71/)).toBeVisible();
  await expect(panel).not.toContainText(code);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
