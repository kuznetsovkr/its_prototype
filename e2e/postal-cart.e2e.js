/* global localStorage, sessionStorage */
import { expect, test } from "@playwright/test";

test.setTimeout(60_000);
test("корзина: Почта России, сертификат, сохранённый состав и отдельная оплата доставки", async ({ page }, info) => {
  test.skip(!info.project.name.endsWith("live-checkout"), "Run with the real-checkout configuration, not demo shortcuts");
  const access = { version: 1, id: "01234567-89ab-4cde-8fab-0123456789ab", token: "a".repeat(64), expiresAt: "2030-01-01T00:00:00.000Z" };
  const postalPoint = "660000, Красноярск, Мира, 1";
  const total = 11500;
  const items = [{ id: "01234567-89ab-4cde-8fab-012345678901", productType: "Худи", unitPrice: 6500, linePrice: 6500 },
    { id: "01234567-89ab-4cde-8fab-012345678902", productType: "Футболка", unitPrice: 5000, linePrice: 5000 }]
    .map(item => ({ ...item, requestKey: item.id, color: "Чёрный", size: "M", embroideryType: "Car", carDesign: "simple", quantity: 1, imageUrl: "/fixture-postal-clothing.webp" }));
  const calls = { quotes: [], creates: [], completes: 0, bank: 0, cdek: 0 };
  let checkout = null; let completed = false;
  await page.addInitScript(({ access, postalPoint }) => {
    localStorage.setItem("its_cart_access_v1", JSON.stringify(access));
    sessionStorage.setItem("its_order_draft_v1", JSON.stringify({ version: 1, uploadFiles: [], order: {
      clothing: {}, embroidery: {}, recipient: {
        userData: { firstName: "Иван", lastName: "Иванов", middleName: "", phone: "+7 (999) 123-45-67" }, hasNoMiddleName: true, privacyConsent: true,
        deliveryMethod: "russian_post", postalPoint,
        deliveryCity: { id: "city:278", name: "Красноярск", label: "г Красноярск", longitude: 92.868, latitude: 56.01, pickup: true, token: "fixture-city", expiresAt: Date.now() + 86400000 },
      },
    } }));
  }, { access, postalPoint });
  await page.route("**/api/**", route => route.abort());
  await page.route("**/service.php**", route => { calls.cdek++; return route.abort(); });
  await page.route("**/fixture-postal-clothing.webp", route => route.fulfill({ path: "src/images/hoodie.webp", contentType: "image/webp" }));
  await page.route("**/api/public-config", route => route.fulfill({ json: { turnstile: { enabled: false } } }));
  await page.route(`**/api/cart/${access.id}`, route => route.fulfill({ json: {
    id: access.id, revision: 2, expiresAt: access.expiresAt, items: completed ? [] : items, merchandisePrice: completed ? 0 : total, checkout,
  } }));
  await page.route(`**/api/cart/${access.id}/quote`, route => {
    const input = route.request().postDataJSON(); calls.quotes.push(input);
    const discount = input.certificateCode ? total : 0;
    return route.fulfill({ json: { revision: 2, isCartOrder: true, manual: false, merchandisePrice: total, totalPrice: total, deliveryPrice: null,
      deliveryPayLater: true, certificateDiscount: discount, amountDue: total - discount, paymentAmount: total - discount, requiresBankPayment: discount === 0, quoteHash: "a".repeat(64) } });
  });
  await page.route(`**/api/cart/${access.id}/checkout`, route => {
    const input = route.request().postDataJSON(); calls.creates.push(input);
    checkout = { orderId: 43, orderToken: "fixture-cart-order-token", isCartOrder: true, deliveryMode: "russian_post", postalPoint,
      deliveryAddress: "Почта России, " + postalPoint, deliveryCity: "Красноярск", deliveryPayLater: true, deliveryPrice: null, items,
      merchandisePrice: total, totalPrice: total, certificateDiscount: total, amountDue: 0, paymentAmount: 0, requiresBankPayment: false,
      paymentStatus: "pending", buyer: { ...input.buyer, recipientFullName: "Иванов Иван", recipientPhone: "+79991234567" } };
    return route.fulfill({ json: checkout });
  });
  await page.route("**/api/orders/43/complete-certificate", route => {
    calls.completes++; completed = true; checkout = null; return route.fulfill({ json: { ok: true } });
  });
  await page.route("**/api/payments/paykeeper/link", route => { calls.bank++; return route.abort(); });
  await page.goto("/recipient?cart=1");
  await expect(page.getByRole("radio", { name: "Почта России", exact: true })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Самовывоз", exact: true })).toBeDisabled();
  await expect(page.locator(".recipientCart__item")).toHaveCount(2);
  await expect(page.locator(".recipientOrderSummary")).toContainText(/11\s*500/);
  await page.getByPlaceholder("Промокод / Сертификат").fill("ITS" + "A1".repeat(16));
  await page.getByRole("button", { name: "Применить", exact: true }).click();
  await expect(page.getByText("Промокод применён. Стоимость заказа пересчитана.")).toBeVisible();
  await expect(page.locator(".recipientOrderSummary")).toContainText(/К оплате: 0/);
  await expect(page.locator(".recipientOrderSummary")).toContainText("Доставка Почтой России оплачивается отдельно");
  await page.locator(".recipientOrderCard").screenshot({ path: info.outputPath("postal-cart.png") });
  await page.locator(".recipientOrderNavigation__submit").click();
  await expect(page.getByRole("heading", { name: "спасибо за заказ", exact: true })).toBeVisible();
  await expect(page.locator(".thx__text")).toContainText("Доставка Почтой России оплачивается отдельно");
  expect(calls.creates).toHaveLength(1);
  expect(calls.creates[0].deliveryMethod).toBe("russian_post");
  expect(calls.creates[0].postalPoint).toBe(postalPoint);
  expect(calls.creates[0].officeCode).toBeUndefined();
  expect(calls.quotes.every(input => input.deliveryCityToken === "fixture-city" && !input.officeCode)).toBe(true);
  expect(calls.completes).toBe(1); expect(calls.bank).toBe(0); expect(calls.cdek).toBe(0);
});
