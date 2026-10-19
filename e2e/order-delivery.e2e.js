import { expect, test } from "@playwright/test";

test.setTimeout(90_000);
test.beforeEach(async ({ page }, info) => {
  test.skip(!info.project.name.endsWith("live-checkout"), "Run with test:e2e:completion: delivery creation must not use the demo shortcut");
  await page.route("**/api/**", (route) => route.abort());
  await page.route("**/service.php**", (route) => route.abort());
});
const postalPoint = "660075, Красноярск, ул. Маерчака, 5";
const uploadAndContinue = async (page) => {
  await page.getByRole("button", { name: "далее", exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: "car.png", mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aHy4AAAAASUVORK5CYII=", "base64") });
  await page.getByRole("button", { name: "далее", exact: true }).click();
  await expect(page).toHaveURL(/\/recipient$/);
};
const prepare = async (page, { failFirstPayment = false, certificateDiscount = 0, bankReturn = false } = {}) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("its_order_draft_v1")) return;
    sessionStorage.setItem("its_order_draft_v1", JSON.stringify({ version: 1, uploadFiles: [], order: {
      clothing: { type: "Hoodie", color: "Чёрный", size: "M", previewSrc: "/fixture-hoodie.webp", previewAlt: "Чёрное худи" },
      embroidery: { type: "Car", carDesign: "medium", typeSelectionExplicit: true, uploadedImage: [] },
      recipient: { userData: { firstName: "Иван", lastName: "Иванов", middleName: "", phone: "+7 (999) 123-45-67" },
        deliveryCity: { id: "cdek:278", name: "Красноярск", label: "г Красноярск", longitude: 92.868, latitude: 56.0106, pickup: true, token: "fixture-city", expiresAt: Date.now() + 86400000 },
        hasNoMiddleName: true, privacyConsent: true, pickupPoint: "Старый ПВЗ", cdek: { mode: "office", address: { code: "KRS1" } } },
    } }));
  });
  const calls = { quotes: [], creates: [], confirms: [], links: [], completes: [] };
  await page.route("**/fixture-hoodie.webp", (route) => route.fulfill({ contentType: "image/webp", path: "src/images/hoodie.webp" }));
  await page.route("**/api/public-config", (route) => route.fulfill({ json: { turnstile: { enabled: false } } }));
  await page.route("**/api/pricing/quote", (route) => route.fulfill({ json: { prices: { Car: 6500, Patronus: 15000, petFace: 8000 }, carDesignPrices: { simple: 6500, medium: 8500, complex: 11500 } } }));
  await page.route("**/api/pricing/checkout", (route) => {
    const input = route.request().postDataJSON(); calls.quotes.push(input);
    if (input.deliveryMethod === "russian_post") {
      const discount = input.certificateCode ? certificateDiscount : 0;
      return route.fulfill({ json: { merchandisePrice: 8500, deliveryPrice: null, certificateDiscount: discount,
        deliveryPayLater: true, totalPrice: 8500, paymentAmount: 8500 - discount, amountDue: 8500 - discount, requiresBankPayment: discount < 8500 } });
    }
    return route.fulfill({ json: { merchandisePrice: 8500, deliveryPrice: 742, totalPrice: 9242, paymentAmount: 9242 } });
  });
  await page.route("**/api/orders/create", (route) => {
    const body = route.request().postData(); calls.creates.push(body);
    const discount = body.includes('name="certificateCode"') ? certificateDiscount : 0;
    if (body.includes('name="deliveryMethod"\r\n\r\nrussian_post')) return route.fulfill({ json: { orderId: 42, orderToken: "fixture-order-token",
      pricePending: false, deliveryMode: "russian_post", deliveryPayLater: true, merchandisePrice: 8500, deliveryPrice: null,
      certificateDiscount: discount, totalPrice: 8500, paymentAmount: 8500 - discount, amountDue: 8500 - discount, requiresBankPayment: discount < 8500 } });
    return route.fulfill({ json: { orderId: 42, orderToken: "fixture-order-token", pricePending: true,
      totalPrice: null, paymentAmount: null, requiresBankPayment: false } });
  });
  await page.route("**/api/orders/confirm/42", (route) => {
    calls.confirms.push({ body: route.request().postDataJSON(), token: route.request().headers()["x-order-access-token"] });
    return route.fulfill({ json: { ok: true } });
  });
  await page.route("**/api/payments/paykeeper/link", (route) => {
    calls.links.push(route.request().postDataJSON());
    return route.fulfill(failFirstPayment && calls.links.length === 1 ? { status: 503, json: { message: "Тестовый сбой оплаты" } }
      : { json: { pay_url: `http://127.0.0.1:4173/${bankReturn ? "payment-success" : "fixture-postal-bank"}` } });
  });
  await page.route("**/api/orders/42", route => route.fulfill({ json: { paymentStatus: "paid", status: "Оплачено", deliveryMode: "russian_post" } }));
  await page.route("**/api/orders/42/complete-certificate", route => { calls.completes.push(route.request().postDataJSON()); return route.fulfill({ json: { ok: true } }); });
  await page.route("**/fixture-postal-bank", route => route.fulfill({ contentType: "text/html", body: "Fixture bank, no real payment" }));
  await page.goto("/embroidery");
  await uploadAndContinue(page);
  await expect(page.getByRole("radio", { name: "СДЭК", exact: true })).toBeChecked();
  await expect(page.locator(".recipientOrderSummary")).toContainText(/9\s*242/);
  return calls;
};

test("новые способы адаптивны, переключаются клавиатурой и не перекрывают форму", async ({ page }, info) => {
  await prepare(page);
  const cdek = page.getByRole("radio", { name: "СДЭК", exact: true });
  await cdek.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("radio", { name: "Почта России", exact: true })).toBeChecked();
  const postal = page.getByRole("textbox", { name: "Отделение Почты России", exact: true });
  await expect(postal).toHaveAttribute("maxlength", "241");
  await expect(page.locator("#recipient-postal-help")).toContainText("Доставка оплачивается отдельно после изготовления заказа");
  await expect(page.locator("#recipient-postal-help")).toContainText("отправит чек");
  await postal.fill(postalPoint);
  const widths = info.project.name.startsWith("desktop") ? [1920, 1440, 1200, 1199, 820, 640] : [320, 390, 428, 639];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => document.fonts.ready);
    for (const method of ["russian_post", "pickup"]) {
      await page.getByRole("radio", { name: method === "pickup" ? "Самовывоз" : "Почта России", exact: true }).check();
      const [personal, delivery, details, tail, consent, form, submit, card] = await Promise.all([
        page.locator(".recipientOrderForm__field--orderComment").boundingBox(), page.locator(".recipientOrderForm__delivery").boundingBox(),
        page.locator(".recipientDeliveryDetails").boundingBox(), page.locator(".recipientOrderForm__checkoutTail").boundingBox(),
        page.locator(".recipientOrderForm__consent").boundingBox(), page.locator(".recipientOrderForm").boundingBox(),
        page.locator(".recipientOrderNavigation__submit").boundingBox(), page.locator(".recipientOrderCard").boundingBox(),
      ]);
      expect(delivery.y).toBeGreaterThanOrEqual(personal.y + personal.height);
      expect(tail.y).toBeGreaterThanOrEqual(details.y + details.height);
      const factor = width < 1200 ? width / (width < 640 ? 320 : 640) : 1;
      expect(form.y + form.height - consent.y - consent.height).toBeGreaterThanOrEqual(30 * factor - 1);
      expect(submit.y).toBeGreaterThanOrEqual(form.y + form.height);
      expect(card.y + card.height + 1).toBeGreaterThanOrEqual(submit.y + submit.height);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      const icons = await page.locator(".recipientDeliveryMethods img").evaluateAll((images) => images.map((img) => ({
        loaded: img.complete && img.naturalWidth > 0, width: img.getBoundingClientRect().width, height: img.getBoundingClientRect().height,
      })));
      expect(icons).toHaveLength(6);
      expect(icons.every((icon) => icon.loaded && Math.abs(icon.width - icon.height) < 1)).toBe(true);
      if (method === "russian_post" && width < 1200) expect(await postal.evaluate((input) => parseFloat(getComputedStyle(input).fontSize))).toBeGreaterThanOrEqual(16);
      await page.locator(".recipientOrderPage").screenshot({ path: info.outputPath(`${method}-${width}.png`) });
    }
  }
  await expect(page.getByText("Время по согласованию", { exact: true })).toBeVisible();
  await expect(page.getByText(/Ломоносова, 11/)).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Город получения" })).toHaveValue(/Красноярск/);
});

test("Почта: оплата изделия и возврат из банка не включают доставку в оплаченный итог", async ({ page }) => {
  const calls = await prepare(page, { bankReturn: true });
  await page.getByRole("radio", { name: "Почта России", exact: true }).check();
  await page.getByRole("textbox", { name: "Отделение Почты России", exact: true }).fill(postalPoint);
  await expect(page.locator(".recipientOrderSummary")).toContainText(/8\s*500/);
  await expect(page.locator(".recipientOrderSummary")).toContainText("Доставка Почтой России оплачивается отдельно");
  await expect(page.locator(".recipientOrderSummary")).not.toContainText(/Доставка: 0|9\s*242/);
  await page.locator(".recipientOrderNavigation__submit").click();
  await expect(page.getByRole("heading", { name: "спасибо за заказ", exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".thx__text")).toContainText("Доставка Почтой России оплачивается отдельно после изготовления");
  expect(calls.links).toEqual([{ orderId: 42 }]);
  expect(calls.confirms).toHaveLength(0);
  expect(calls.creates[0]).not.toContain('name="cdekAddress"');
  expect(calls.quotes.filter(quote => quote.deliveryMethod === "russian_post").every(quote => !quote.cdekMode && !quote.cdekAddress)).toBe(true);
});

test("Почта: сертификат покрывает изделие целиком без перехода в банк, доставка остаётся отдельной", async ({ page }) => {
  const calls = await prepare(page, { certificateDiscount: 8500 });
  await page.getByRole("radio", { name: "Почта России", exact: true }).check();
  await page.getByRole("textbox", { name: "Отделение Почты России", exact: true }).fill(postalPoint);
  await page.getByPlaceholder("Промокод / Сертификат").fill("ITS" + "A1".repeat(16));
  await page.getByRole("button", { name: "Применить", exact: true }).click();
  await expect(page.getByText("Промокод применён. Стоимость заказа пересчитана.")).toBeVisible();
  await expect(page.locator(".recipientOrderSummary")).toContainText(/К оплате: 0/);
  await page.locator(".recipientOrderNavigation__submit").click();
  await expect(page.getByRole("heading", { name: "спасибо за заказ", exact: true })).toBeVisible();
  await expect(page.locator(".thx__text")).toContainText("Доставка Почтой России оплачивается отдельно");
  expect(calls.completes).toEqual([{}]);
  expect(calls.links).toHaveLength(0);
  expect(calls.confirms).toHaveLength(0);
});

test("переключение и обновление сохраняют отделение, но не используют старые ПВЗ и стоимость", async ({ page }) => {
  const calls = await prepare(page);
  await page.getByRole("radio", { name: "Почта России", exact: true }).check();
  const submit = page.locator(".recipientOrderNavigation__submit");
  await expect(submit).toBeDisabled();
  await page.getByRole("textbox", { name: "Отделение Почты России", exact: true }).fill(postalPoint);
  await expect(submit).toBeEnabled();
  await expect(page.locator(".recipientOrderSummary")).not.toContainText(/9\s*242/);
  await page.getByRole("checkbox", { name: "Получатель — другой человек" }).check();
  await page.locator(".recipientOrderForm__group--recipient input").fill("Петров Пётр");
  await expect(submit).toBeDisabled();
  await page.getByRole("radio", { name: "Самовывоз", exact: true }).check();
  await expect(submit).toBeEnabled();
  await expect(page.locator(".recipientOrderForm__group--recipient input")).toHaveCount(0);
  await page.getByRole("radio", { name: "Почта России", exact: true }).check();
  await expect(page.getByRole("textbox", { name: "Отделение Почты России", exact: true })).toHaveValue(postalPoint);
  await expect(page.locator(".recipientOrderForm__group--recipient input")).toHaveValue("Петров Пётр");
  await page.locator(".recipientOrderForm__group--recipientPhone input").fill("+7 (912) 345-67-89");
  await page.reload();
  await expect(page).toHaveURL(/\/embroidery$/);
  await uploadAndContinue(page);
  await expect(page.getByRole("radio", { name: "Почта России", exact: true })).toBeChecked();
  await expect(page.getByRole("textbox", { name: "Отделение Почты России", exact: true })).toHaveValue(postalPoint);
  await page.getByRole("radio", { name: "СДЭК", exact: true }).check();
  await expect(page.getByRole("button", { name: "Выберите пункт получения СДЭК", exact: true })).toBeVisible();
  await expect(page.locator(".recipientOrderNavigation__submit")).toBeDisabled();
  expect(calls.quotes.filter(quote => quote.deliveryMethod !== "russian_post")).toHaveLength(1);
  await page.getByRole("button", { name: "Выберите пункт получения СДЭК", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Выбор пункта СДЭК", exact: true })).toBeVisible();
});

for (const [method, label] of [["pickup", "Самовывоз"]]) {
  test(`${label}: сохраняется заявка с нужным способом без запроса банковской оплаты`, async ({ page }) => {
    const calls = await prepare(page);
    await page.getByRole("radio", { name: label, exact: true }).check();
    if (method === "russian_post") await page.getByRole("textbox", { name: "Отделение Почты России", exact: true }).fill(postalPoint);
    await page.getByRole("button", { name: "отправить заявку", exact: true }).click();
    await expect(page.getByRole("heading", { name: "заявка оформлена", exact: true })).toBeVisible();
    await expect(page.locator(".thx__text")).not.toContainText("индивидуальной вышивки");
    await expect(page.locator(".thx__text")).not.toContainText("оплачен");
    expect(calls.creates).toHaveLength(1);
    expect(calls.creates[0]).toContain(`name="deliveryMethod"\r\n\r\n${method}`);
    expect(calls.creates[0]).toContain(method === "pickup" ? "Ломоносова, 11" : postalPoint);
    expect(calls.creates[0]).not.toContain('name="cdekMode"');
    expect(calls.creates[0]).not.toContain('name="cdekAddress"');
    expect(calls.confirms).toEqual([{ body: { provider: "manual" }, token: "fixture-order-token" }]);
    expect(calls.links).toHaveLength(0);
  });
}

test("повтор почтовой оплаты блокирует изменение способа и не создаёт второй заказ", async ({ page }) => {
  const calls = await prepare(page, { failFirstPayment: true });
  await page.getByRole("radio", { name: "Почта России", exact: true }).check();
  await page.getByRole("textbox", { name: "Отделение Почты России", exact: true }).fill(postalPoint);
  const submit = page.locator(".recipientOrderNavigation__submit");
  await submit.click();
  await expect(page.getByText(/Заказ уже сохранён — повторите оплату/)).toBeVisible();
  await expect(page.getByRole("radio", { name: "Самовывоз", exact: true })).toBeDisabled();
  await expect(page.getByRole("textbox", { name: "Отделение Почты России", exact: true })).toBeDisabled();
  await submit.click();
  await expect(page).toHaveURL(/fixture-postal-bank$/);
  expect(calls.creates).toHaveLength(1);
  expect(calls.confirms).toHaveLength(0);
  expect(calls.links).toEqual([{ orderId: 42 }, { orderId: 42 }]);
});
