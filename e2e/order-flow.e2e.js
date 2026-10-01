import { expect, test } from "@playwright/test";

const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    let nextWidgetId = 0;
    const widgets = new Map();
    const verify = (widgetId) => {
      queueMicrotask(() => {
        widgets.get(widgetId)?.callback?.(`e2e-turnstile-token-${widgetId}`);
      });
    };

    window.turnstile = {
      render: (_container, options) => {
        const widgetId = ++nextWidgetId;
        widgets.set(widgetId, options);
        verify(widgetId);
        return widgetId;
      },
      remove: (widgetId) => widgets.delete(widgetId),
      reset: (widgetId) => verify(widgetId),
    };
  });

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
  await expect(page.getByRole("heading", { name: "Выберите тип вышивки" })).toBeVisible({ timeout: 20_000 });
  if (await page.locator('input[name="embroideryTypeDesktop"]:checked').count() === 0) {
    await page.locator('.embroideryDesktopChoice:has(input[value="Patronus"]) .embroideryDesktopChoice__select').click();
  }
  await page.locator(".embroiderySelectorDesktop__navigation .is-next").click();
  await expect(page).toHaveURL(/\/recipient$/);
  await expect(page.getByRole("heading", { name: "Введите свои данные" })).toBeVisible();
};

test("примеры работ открываются с клавиатуры и закрываются без изменения выбора", async ({ page }) => {
  await startOrder(page);

  const choice = page.locator('.embroideryDesktopChoice:has(input[value="Patronus"])');
  const trigger = choice.getByRole("button", { name: "пример работы" });
  const dialog = page.getByRole("dialog", { name: "Примеры работ" });
  const close = dialog.getByRole("button", { name: "Закрыть окно" });

  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(dialog).toBeVisible();
  await expect(close).toBeFocused();
  await expect(dialog.locator("img")).toHaveCount(5);
  await expect.poll(() => dialog.locator("img").evaluateAll((images) =>
    images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
  const modalBox = await dialog.boundingBox();
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  expect(modalBox.x).toBeGreaterThanOrEqual(0);
  expect(modalBox.x + modalBox.width).toBeLessThanOrEqual(viewportWidth + 1);
  for (const image of await dialog.locator("img").all()) {
    const box = await image.boundingBox();
    expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(2);
  }
  await expect(choice.locator("input")).not.toBeChecked();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("");

  await trigger.click();
  await close.click();
  await expect(dialog).toHaveCount(0);

  await trigger.click();
  await page.locator(".modalOverlay").click({ position: { x: 5, y: 5 } });
  await expect(dialog).toHaveCount(0);
});

test("таблица размеров использует общую модалку и возвращает фокус", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Таблица размеров скрыта на мобильном макете");
  await page.goto("/order");
  const trigger = page.getByRole("button", { name: "Таблица размеров" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Таблица размеров" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Закрыть таблицу размеров" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("цена появляется только после выбора типа и скрывается после сброса", async ({ page }) => {
  await page.goto("/order");
  await expect(page.locator(".clothingPrice")).toHaveCount(0);
  await page.locator('.selectorType__item:has(input[value="Hoodie"])').click();
  await page.locator('.sizeSelector__item:has(input[value="M"]) .sizeSelector__box').click();
  await page.locator(".orderNavigation .orderActionButton--next").click();
  await expect(page).toHaveURL(/\/embroidery$/);

  const price = page.locator(".embroiderySelectorDesktop__price");
  const next = page.locator(".embroiderySelectorDesktop__navigation .is-next");
  const patronus = page.locator('.embroideryDesktopChoice:has(input[value="Patronus"]) .embroideryDesktopChoice__select');
  const petFace = page.locator('.embroideryDesktopChoice:has(input[value="petFace"]) .embroideryDesktopChoice__select');
  const counter = page.locator(".embroideryDesktopCounter");

  await expect(price).toHaveCount(0);
  await expect(next).toBeDisabled();
  await patronus.click();
  await expect(price).toContainText(/Цена:\s*10\s*000 руб/);
  await expect(counter.locator(".embroideryDesktopCounter__value")).toHaveText("1 шт");
  for (let count = 2; count <= 4; count += 1) {
    await counter.getByRole("button", { name: "Увеличить количество" }).click();
  }
  await expect(counter.locator(".embroideryDesktopCounter__value")).toHaveText("4 шт");
  await expect(counter.getByRole("button", { name: "Увеличить количество" })).toBeDisabled();
  await expect(price).toContainText(/25\s*000 руб/);

  await patronus.click();
  await expect(price).toHaveCount(0);
  await expect(next).toBeDisabled();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Выберите тип вышивки" })).toBeVisible({ timeout: 20_000 });
  await expect(price).toHaveCount(0);
  await page.evaluate(() => {
    const draft = JSON.parse(sessionStorage.getItem("its_order_draft_v1"));
    draft.order.embroidery.type = "Patronus";
    draft.order.embroidery.price = 10000;
    delete draft.order.embroidery.typeSelectionExplicit;
    sessionStorage.setItem("its_order_draft_v1", JSON.stringify(draft));
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Выберите тип вышивки" })).toBeVisible({ timeout: 20_000 });
  await expect(price).toHaveCount(0);

  await petFace.click();
  for (let count = 2; count <= 5; count += 1) {
    await counter.getByRole("button", { name: "Увеличить количество" }).click();
  }
  await expect(counter.locator(".embroideryDesktopCounter__value")).toHaveText("5 шт");
  await expect(counter.getByRole("button", { name: "Увеличить количество" })).toBeDisabled();
  await expect(price).toContainText(/16\s*000 руб/);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Выберите тип вышивки" })).toBeVisible({ timeout: 20_000 });
  await expect(price).toContainText(/16\s*000 руб/);
  await expect(counter.locator(".embroideryDesktopCounter__value")).toHaveText("5 шт");

  await page.locator('.embroideryDesktopChoice:has(input[value="Car"]) .embroideryDesktopChoice__select').click();
  await expect(counter).toHaveCount(0);
  await expect(price).toContainText(/8\s*500 руб/);
});

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

test("другой получатель требует телефон, а выбор ПВЗ не требует поля города", async ({ page }, testInfo) => {
  await startOrder(page);
  await continueToRecipient(page);

  const submitButton = page.locator(".recipientOrderNavigation__submit");
  const recipientName = page.locator(".recipientOrderForm__group--recipient input");
  const recipientPhone = page.getByRole("textbox", { name: "Телефон другого получателя" });

  await expect(page.getByText("Город", { exact: true })).toHaveCount(0);
  await page.getByPlaceholder("ФИО").fill("Иванов Иван Иванович");
  await page.getByPlaceholder("Номер телефона").fill("+7 999 123-45-67");
  await page.locator(".recipientOrderForm__deliveryMethod").click();
  await page.getByRole("button", { name: "Select demo pickup point" }).click();
  await page.getByRole("checkbox", { name: /Я даю своё согласие/ }).check();
  await expect(page.getByTestId("turnstile-panel")).toHaveClass(/is-verified/, { timeout: 20_000 });

  await expect(recipientName).toHaveValue("");
  await expect(recipientPhone).toHaveValue("");
  await expect(submitButton).toBeEnabled();

  await recipientName.fill("Петров Пётр Петрович");
  await expect(submitButton).toBeDisabled();
  await expect(page.getByText("Укажите корректный телефон получателя")).toBeVisible();

  await recipientPhone.fill("89123456789");
  await expect(recipientPhone).toHaveValue("+7 (912) 345-67-89");
  await expect(submitButton).toBeEnabled();

  const expectFormSpacing = async () => {
    const [nameBox, phoneBox, commentBox, consentBox, turnstileBox] = await Promise.all([
      recipientName.boundingBox(),
      recipientPhone.boundingBox(),
      page.locator(".recipientOrderForm__group--deliveryComment input").boundingBox(),
      page.locator(".recipientOrderForm__consent").boundingBox(),
      page.getByTestId("turnstile-panel").boundingBox(),
    ]);
    expect(phoneBox.y).toBeGreaterThan(nameBox.y + nameBox.height);
    expect(commentBox.y).toBeGreaterThan(phoneBox.y + phoneBox.height);
    expect(turnstileBox.y - (consentBox.y + consentBox.height)).toBeGreaterThanOrEqual(25);
  };
  await expectFormSpacing();
  if (testInfo.project.name === "desktop-chromium") {
    await page.setViewportSize({ width: 820, height: 1180 });
    await expectFormSpacing();
  }

  await page.reload();
  await expect(page.getByRole("heading", { name: "Введите свои данные" })).toBeVisible({ timeout: 20_000 });
  await expect(recipientName).toHaveValue("Петров Пётр Петрович");
  await expect(recipientPhone).toHaveValue("+7 (912) 345-67-89");

  await recipientPhone.fill("");
  await recipientName.fill("");
  await expect(recipientPhone).toHaveValue("");
  await expect(submitButton).toBeEnabled();
});

test("мобильная шапка сохраняет корзину и центр логотипа без избранного", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Проверка мобильной шапки");

  await page.goto("/");
  const header = page.locator(".home-header").first();
  const logo = header.locator(".home-header__logo");
  const bag = header.getByRole("button", { name: "Перейти к заказу" }).first();
  await expect(header.getByRole("button", { name: "Избранное" })).toHaveCount(0);
  await expect(bag).toBeVisible();

  const [headerBox, logoBox, bagBox] = await Promise.all([
    header.boundingBox(),
    logo.boundingBox(),
    bag.boundingBox(),
  ]);
  expect(Math.abs((logoBox.x + logoBox.width / 2) - (headerBox.x + headerBox.width / 2)))
    .toBeLessThan(2);
  expect(headerBox.x + headerBox.width - (bagBox.x + bagBox.width)).toBeLessThanOrEqual(25);

  await bag.click();
  await expect(page).toHaveURL(/\/order$/);
});

test("выбор изделия сохраняется при возврате с шага вышивки", async ({ page }) => {
  await startOrder(page);

  await page.getByRole("button", { name: "Вернуться назад" }).click();
  await expect(page).toHaveURL(/\/order$/);
  await expect(page.locator('input[name="clothing"][value="T-shirt"]')).toBeChecked();
  await expect(page.locator('input[name="size"][value="M"]')).toBeChecked();
  await expect(page.locator(".orderNavigation .orderActionButton--next")).toBeEnabled();
});

test("выбранное превью изделия сохраняется на следующих шагах", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Проверка мобильного пути заказа");

  await page.goto("/order");
  const hoodieOption = page.locator('.selectorType__item:has(input[value="Hoodie"])');
  await hoodieOption.click();
  await expect(page.locator('input[name="clothing"][value="Hoodie"]')).toBeChecked();

  const mediumSize = page.locator('input[name="size"][value="M"]');
  await expect(mediumSize).toBeEnabled();
  await page.locator('.sizeSelector__item:has(input[value="M"]) .sizeSelector__box').click();

  const clothingPreview = page.locator(".clotheImage");
  await expect(clothingPreview).toHaveAttribute("src", /hoodie.*\.webp/i);
  const selectedPreviewSrc = await clothingPreview.getAttribute("src");

  await page.locator(".orderNavigation .orderActionButton--next").click();
  await expect(page).toHaveURL(/\/embroidery$/);
  await expect(page.locator(".embroiderySelectorDesktop__imageFrame img"))
    .toHaveAttribute("src", selectedPreviewSrc);

  await continueToRecipient(page);
  await expect(page.locator(".recipientOrderCard__imageFrame img"))
    .toHaveAttribute("src", selectedPreviewSrc);
});

test("прямое открытие страницы благодарности возвращает к оформлению", async ({ page }) => {
  await page.goto("/thank-you");

  await expect(page).toHaveURL(/\/order$/);
  await expect(page.getByRole("heading", { name: "заказ изделия" })).toBeVisible();
});

test("прямое открытие шага вышивки возвращает к выбору изделия", async ({ page }) => {
  await page.goto("/embroidery");

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

test("дополнительные примеры работ раскрываются и сворачиваются", async ({ page }, testInfo) => {
  await page.goto("/");
  const works = page.locator(".home-works");
  const items = works.locator(".home-works__item");
  const moreButton = works.locator(".home-works__more");
  const initialCount = testInfo.project.name === "mobile-chromium" ? 6 : 9;

  await expect(items).toHaveCount(initialCount, { timeout: 20_000 });
  await expect(moreButton).toHaveAttribute("aria-expanded", "false");

  await moreButton.click();
  await expect(works).toHaveClass(/is-expanded/);
  await expect(items).toHaveCount(initialCount + 9);
  await expect(works.locator(".home-works__item--additional")).toHaveCount(9);
  await expect(moreButton).toHaveAttribute("aria-expanded", "true");
  await expect.poll(() => page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
  )).toBe(true);

  await moreButton.click();
  await expect(works).not.toHaveClass(/is-expanded/);
  await expect(items).toHaveCount(initialCount);
});

test("order steps preserve the current scroll position", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Mobile order navigation regression check");

  await page.goto("/order");
  await page.locator('.sizeSelector__item:has(input[value="M"]) .sizeSelector__box').click();
  const clothingNext = page.locator(".orderNavigation .orderActionButton--next");
  await expect(clothingNext).toBeEnabled();

  await page.evaluate(() => window.scrollTo(0, 300));
  const clothingScrollPosition = await page.evaluate(() => window.scrollY);
  await clothingNext.evaluate((button) => button.click());
  await expect(page).toHaveURL(/\/embroidery$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(clothingScrollPosition);

  const embroideryNext = page.locator(".embroiderySelectorDesktop__navigation .is-next");
  await page.locator('.embroideryDesktopChoice:has(input[value="Patronus"]) .embroideryDesktopChoice__select').click();
  await expect(embroideryNext).toBeEnabled();
  await page.evaluate(() => window.scrollTo(0, 300));
  const embroideryScrollPosition = await page.evaluate(() => window.scrollY);
  await embroideryNext.evaluate((button) => button.click());
  await expect(page).toHaveURL(/\/recipient$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(embroideryScrollPosition);
});

test("мобильные шаги заказа используют белый фон и квадратное превью", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Проверка только мобильной вёрстки");

  const expectWhiteBackground = async (selector) => {
    await expect(page.locator(selector)).toHaveCSS("background-color", "rgb(255, 255, 255)");
  };
  const expectSquarePreview = async (selector, imageSelector) => {
    const preview = page.locator(selector);
    await expect(preview).toBeVisible();
    const bounds = await preview.boundingBox();
    expect(Math.abs(bounds.width - bounds.height)).toBeLessThanOrEqual(1);
    await expect(page.locator(imageSelector)).toHaveCSS("object-fit", "contain");
  };

  await page.goto("/order");
  await expect(page.locator(".clotheImage")).toBeVisible();
  await expectWhiteBackground(".orderPage");
  await expectSquarePreview(".image-frame", ".clotheImage");

  const mediumSize = page.locator('input[name="size"][value="M"]');
  const mediumSizeItem = page.locator('.sizeSelector__item:has(input[value="M"])');
  const mediumSizeBox = mediumSizeItem.locator(".sizeSelector__box");
  await expect(mediumSize).toBeEnabled();
  await expect(mediumSizeItem).toHaveCSS("-webkit-tap-highlight-color", "rgba(0, 0, 0, 0)");
  await expect(mediumSizeBox).toHaveCSS("transition-duration", "0s");
  await mediumSizeBox.click();
  await page.locator(".orderNavigation .orderActionButton--next").click();
  await expect(page).toHaveURL(/\/embroidery$/);
  await expectWhiteBackground(".embroideryPage");
  await expectSquarePreview(
    ".embroiderySelectorDesktop__imageFrame",
    ".embroiderySelectorDesktop__imageFrame img",
  );
  const embroideryFrameBounds = await page
    .locator(".embroiderySelectorDesktop__imageFrame")
    .boundingBox();
  const embroideryImageBounds = await page
    .locator(".embroiderySelectorDesktop__imageFrame img")
    .boundingBox();
  expect(Math.abs(embroideryImageBounds.width - embroideryFrameBounds.width)).toBeLessThanOrEqual(1);
  await expect(page.locator(".embroiderySelectorDesktop__imageFrame img"))
    .toHaveClass(/is-product-preview/);

  await continueToRecipient(page);
  await expectWhiteBackground(".recipientOrderPage");
  await expectSquarePreview(
    ".recipientOrderCard__imageFrame",
    ".recipientOrderCard__imageFrame img",
  );

  const shield = page.locator(".recipientOrderForm__turnstileShield");
  const shieldIcon = shield.locator("svg");
  await expect(shield).toBeVisible();
  const shieldBounds = await shield.boundingBox();
  const shieldIconBounds = await shieldIcon.boundingBox();
  expect(shieldBounds.width).toBeGreaterThanOrEqual(32);
  expect(Math.abs(
    shieldBounds.x + shieldBounds.width / 2 -
    (shieldIconBounds.x + shieldIconBounds.width / 2),
  )).toBeLessThanOrEqual(1);
  expect(Math.abs(
    shieldBounds.y + shieldBounds.height / 2 -
    (shieldIconBounds.y + shieldIconBounds.height / 2),
  )).toBeLessThanOrEqual(1);
});

test("mobile text-entry controls use at least a 16px font", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Mobile Safari regression check");

  const textControlSelector = [
    "textarea",
    "select",
    'input:not([type="button"]):not([type="checkbox"]):not([type="color"]):not([type="file"]):not([type="hidden"]):not([type="image"]):not([type="radio"]):not([type="range"]):not([type="reset"]):not([type="submit"])',
  ].join(", ");

  const expectSafeFontSizes = async () => {
    const controls = page.locator(textControlSelector);
    await expect(controls.first()).toBeAttached();

    const undersizedControls = await controls.evaluateAll((elements) => elements
      .map((element) => ({
        control: `${element.tagName.toLowerCase()}[type="${element.getAttribute("type") || "default"}"]`,
        fontSize: Number.parseFloat(window.getComputedStyle(element).fontSize),
      }))
      .filter(({ fontSize }) => fontSize < 16));

    expect(undersizedControls).toEqual([]);
  };

  await page.goto("/admin");
  await expectSafeFontSizes();

  await startOrder(page);
  await page.getByRole("button", { name: "надпись", exact: true }).click();
  await expectSafeFontSizes();
  await page.getByRole("button", { name: "изображение", exact: true }).click();

  await continueToRecipient(page);
  await expectSafeFontSizes();
});

test("order draft survives reloads and temporarily leaving the order flow", async ({ page }) => {
  await page.goto("/order");
  await page.locator('.selectorType__item:has(input[value="Hoodie"])').click();
  await page.locator('.sizeSelector__item:has(input[value="M"]) .sizeSelector__box').click();
  await page.locator(".orderNavigation .orderActionButton--next").click();
  await expect(page).toHaveURL(/\/embroidery$/);

  await page.locator(".embroideryDesktopTabs button").nth(1).click();
  const embroideryText = page.locator(".embroideryDesktopDetails textarea").first();
  await embroideryText.fill("Тестовая надпись");
  await expect.poll(() => page.evaluate(() => {
    const draft = JSON.parse(sessionStorage.getItem("its_order_draft_v1"));
    return draft?.order?.embroidery?.customText;
  })).toBe("Тестовая надпись");

  await page.reload();
  await expect(page).toHaveURL(/\/embroidery$/);
  await expect(embroideryText).toHaveValue("Тестовая надпись");
  await expect(page.locator(".embroiderySelectorDesktop__imageFrame img"))
    .toHaveAttribute("src", /hoodie.*\.webp/i);

  await page.goto("/certificate");
  await page.goto("/");
  await page.locator(".home-hero button").click();
  await expect(page).toHaveURL(/\/order$/);
  await expect(page.locator('input[name="clothing"][value="Hoodie"]')).toBeChecked();
  await expect(page.locator('input[name="size"][value="M"]')).toBeChecked();
});

test("restored draft explains that upload files must be selected again", async ({ page }) => {
  await startOrder(page);
  await page.evaluate(() => {
    const draft = JSON.parse(sessionStorage.getItem("its_order_draft_v1"));
    draft.uploadFiles = [{
      name: "pet-photo.jpg",
      size: 1024,
      lastModified: Date.now(),
    }];
    sessionStorage.setItem("its_order_draft_v1", JSON.stringify(draft));
  });

  await page.reload();
  await expect(page.locator(".embroideryRestoreNotice")).toBeVisible();
  await expect(page.locator(".embroideryRestoreNotice"))
    .toContainText("Загрузите фотографии повторно");
});

test("recipient can explicitly place an order without a middle name", async ({ page }) => {
  await startOrder(page);
  await continueToRecipient(page);

  const fullName = page.locator(".recipientOrderForm__field--fullName");
  const noMiddleName = page.getByRole("checkbox", { name: "У меня нет отчества" });
  await fullName.fill("Иванов Иван");
  await noMiddleName.check();
  await page.getByPlaceholder("Номер телефона").fill("+7 999 123-45-67");
  await page.getByRole("checkbox", { name: /Я даю своё согласие/ }).check();

  const submitButton = page.locator(".recipientOrderNavigation__submit");
  await expect(page.getByTestId("turnstile-panel")).toHaveClass(/is-verified/, {
    timeout: 20_000,
  });
  await expect(submitButton).toBeEnabled();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Введите свои данные" })).toBeVisible({ timeout: 20_000 });
  await expect(noMiddleName).toBeChecked();
  await expect(fullName).toHaveValue("Иванов Иван");
  await expect(page.locator(".recipientOrderForm__group--recipient input"))
    .toHaveValue("");
});
