import { expect, test } from "@playwright/test";

const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/public-config", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        turnstile: {
          enabled: true,
          siteKey: TURNSTILE_TEST_SITE_KEY,
          action: "order_create",
        },
      }),
    });
  });
});

const startOrder = async (page) => {
  await page.goto("/");
  await page.locator(".home-hero").getByRole("button", { name: "Сделать заказ" }).click();

  await expect(page).toHaveURL(/\/order$/);
  await expect(page.getByRole("heading", { name: "заказ изделия" })).toBeVisible();

  const tShirt = page.locator('input[name="clothing"][value="T-shirt"]');
  const mediumSize = page.locator('input[name="size"][value="M"]');
  await expect(tShirt).toBeChecked();
  await expect(mediumSize).toBeEnabled();
  await page.locator('.sizeSelector__item:has(input[value="M"]) .sizeSelector__box').click();

  const nextButton = page.locator(".orderNavigation .orderActionButton--next");
  await expect(nextButton).toBeEnabled();
  await nextButton.click();
  await expect(page).toHaveURL(/\/embroidery$/);
};

const continueToRecipient = async (page) => {
  await expect(page.getByRole("heading", { name: "Выберите тип вышивки" })).toBeVisible();
  await page.locator(".embroiderySelectorDesktop__navigation .is-next").click();
  await expect(page).toHaveURL(/\/recipient$/);
  await expect(page.getByRole("heading", { name: "Введите свои данные" })).toBeVisible();
};

test("покупатель проходит основной путь и начинает новый заказ с чистого состояния", async ({ page }) => {
  await startOrder(page);
  await continueToRecipient(page);

  const submitButton = page.locator(".recipientOrderNavigation__submit");
  await expect(submitButton).toBeDisabled();

  await page.getByPlaceholder("ФИО").fill("Иванов Иван Иванович");
  await page.getByPlaceholder("Номер телефона").fill("+7 999 123-45-67");
  await page.locator(".recipientOrderForm__deliveryMethod").click();
  await expect(page.getByRole("dialog", { name: "Выбор пункта СДЭК" })).toBeVisible();
  await page.getByRole("button", { name: "Select demo pickup point" }).click();

  await page.getByRole("checkbox", { name: /Я даю своё согласие/ }).check();
  await expect(page.getByText(/Итого:/)).toBeVisible();
  await expect(page.getByTestId("turnstile-panel")).toHaveClass(/is-verified/, {
    timeout: 20_000,
  });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  await expect(page).toHaveURL(/\/thank-you$/);
  await expect(page.getByRole("heading", { name: /Спасибо!\s*Всё получилось\./ })).toBeVisible();
  await expect(page.locator(".thx__order-number").first()).toHaveText(/^DEMO-\d{8}-\d{6}$/);

  await page.getByRole("link", { name: "на главную", exact: true }).click();
  await page.locator(".home-hero").getByRole("button", { name: "Сделать заказ" }).click();
  await expect(page).toHaveURL(/\/order$/);
  await expect(page.locator('input[name="size"]:checked')).toHaveCount(0);
  await expect(page.locator(".orderNavigation .orderActionButton--next")).toBeDisabled();
});

test("выбор изделия сохраняется при возврате с шага вышивки", async ({ page }) => {
  await startOrder(page);

  await page.getByRole("button", { name: "Вернуться назад" }).click();
  await expect(page).toHaveURL(/\/order$/);
  await expect(page.locator('input[name="clothing"][value="T-shirt"]')).toBeChecked();
  await expect(page.locator('input[name="size"][value="M"]')).toBeChecked();
  await expect(page.locator(".orderNavigation .orderActionButton--next")).toBeEnabled();
});

test("прямое открытие страницы благодарности возвращает к оформлению", async ({ page }) => {
  await page.goto("/thank-you");

  await expect(page).toHaveURL(/\/order$/);
  await expect(page.getByRole("heading", { name: "заказ изделия" })).toBeVisible();
});

test("юридические ссылки в футере открывают отдельные страницы", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator(".home-footer");

  await footer.getByRole("link", { name: "Политика конфиденциальности" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("heading", { name: "Политика конфиденциальности" })).toBeVisible();
  await expect(page.getByText("Документ готовится")).toBeVisible();

  await page.goto("/");
  await footer.getByRole("link", { name: "Публичная оферта" }).click();
  await expect(page).toHaveURL(/\/offer$/);
  await expect(page.getByRole("heading", { name: "Публичная оферта" })).toBeVisible();
  await expect(page.getByText("Документ готовится")).toBeVisible();
});
