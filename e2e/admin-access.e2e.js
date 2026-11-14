import { test, expect } from "@playwright/test";

const type = { id: 1, name: "Худи", code: "hoodie", price: 6500 };
const item = { id: 1, clothingTypeId: 1, productType: "Худи", color: "Зелёный", colorCode: "#448844", size: "M", quantity: 3 };
const orders = [{ id: 42, orderDate: "2026-11-12T10:00:00Z", lastName: "Иванов", firstName: "Иван",
  phone: "+79990000000", email: "fixture@example.com", preferredContact: "Telegram", paymentStatus: "paid", status: "Оплачено",
  totalPrice: 7800, amountDueKopecks: 80000, certificateDiscountKopecks: 700000, deliveryAmountKopecks: 80000,
  deliveryMode: "cdek_pvz", deliveryCity: "Москва", deliveryAddress: "СДЭК, TEST, Тестовая улица, 1", isCartOrder: true,
  items: [{ id: 10, productType: "Худи", color: "Зелёный", size: "M", embroideryType: "Patronus", embroideryTypeRu: "Патронус", patronusCount: 1, petFaceCount: 5, quantity: 1, linePrice: 7000, comment: "Без надписи" }],
  attachments: [{ id: 7, orderItemId: 10, originalName: "photo.png" }],
}, { id: 43, orderDate: "2026-11-12T11:00:00Z", firstName: "Мария", phone: "+79990000001", paymentStatus: "manual", status: "Ожидает расчёта",
  totalPrice: null, productType: "Футболка", color: "Белый", size: "S", embroideryTypeRu: "Другая", deliveryMode: "russian_post", attachments: [],
}];

async function mockAdmin(page, role) {
  const calls = { privileged: [], writes: [] };
  let inventory = [{ ...item }];
  await page.addInitScript(() => {
    localStorage.setItem("token", "fixture-token");
    // A local role must never override the verified server session.
    localStorage.setItem("role", "super_admin");
  });
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/auth/admin-session") return route.fulfill({ json: { role, name: "Сотрудник" } });
    if (url.pathname === "/api/production-notice") return route.fulfill({ json: { enabled: false } });
    if (url.pathname === "/api/admin/production-notice") {
      calls.privileged.push(url.pathname);
      return route.fulfill({ json: { settings: { enabled: false, mode: "manual", manualText: "Сроки изготовления", autoTemplate: "Сроки: {dates}", additionalText: "", revision: 1 }, automaticDates: "15–17 декабря" } });
    }
    if (url.pathname.startsWith("/api/pricing/config")) {
      calls.privileged.push(url.pathname);
      return route.fulfill({ json: { types: [], additional: {} } });
    }
    if (url.pathname.startsWith("/api/admin/certificates")) {
      calls.privileged.push(url.pathname);
      return route.fulfill({ json: { items: [], page: 1, pageSize: 25, total: 0 } });
    }
    if (url.pathname === "/api/admin/orders/42/attachments/7") {
      return route.fulfill({ contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=", "base64") });
    }
    if (url.pathname === "/api/admin/orders") {
      calls.privileged.push(url.pathname);
      const pageNumber = Number(url.searchParams.get("page") || 1);
      return route.fulfill({ json: { items: pageNumber === 1 ? orders : [], page: pageNumber, pageSize: 25, total: 26 } });
    }
    if (url.pathname === "/api/colors") return route.fulfill({ json: [{ name: "Зелёный", code: "#448844" }] });
    if (url.pathname === "/api/clothing-types") return route.fulfill({ json: [type] });
    if (url.pathname === "/api/inventory/1" && request.method() === "PUT") {
      const value = request.postDataJSON();
      calls.writes.push(value);
      inventory = [{ ...item, ...value }];
      return route.fulfill({ json: inventory[0] });
    }
    if (url.pathname === "/api/inventory") return route.fulfill({ json: inventory });
    return route.fulfill({ json: {} });
  });
  return calls;
}

test("warehouse admin edits stock without requesting privileged data", async ({ page }) => {
  const calls = await mockAdmin(page, "admin");
  await page.goto("/admin/inventory");
  await expect(page.getByRole("heading", { name: "управление складом", exact: true })).toBeVisible();
  for (const title of ["Справочники", "Цены и параметры", "Сертификаты", "Заказы", "Сроки изготовления"]) {
    await expect(page.getByRole("heading", { name: title, exact: true })).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Редактировать", exact: true }).click();
  await page.locator(".input-qty").fill("7");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(page.getByText("Складская позиция обновлена.", { exact: true })).toBeVisible();
  expect(calls.writes).toHaveLength(1);
  expect(calls.writes[0].quantity).toBe(7);
  expect(calls.privileged).toEqual([]);
  await page.getByRole("button", { name: "Добавить позицию", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Новая позиция", exact: true })).toBeVisible();
});

test("super admin and owner see catalog, prices, orders and certificates", async ({ page }) => {
  await mockAdmin(page, "super_admin");
  await page.goto("/admin/inventory");
  for (const title of ["Справочники", "Цены и параметры", "Складские позиции", "Сертификаты", "Заказы", "Сроки изготовления"]) {
    await expect(page.getByRole("heading", { name: title, exact: true })).toHaveCount(1);
  }
});

test("owner inspects paid and manual orders, downloads a photo and changes pages", async ({ page }) => {
  await mockAdmin(page, "super_admin");
  await page.goto("/admin/inventory");
  const panel = page.locator(".admin-orders");
  await expect(panel.getByRole("heading", { name: "Заказы", exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(panel.getByText("Оплата подтверждена", { exact: true })).toBeVisible();
  await expect(panel.getByText("Расчёт и оплата через менеджера", { exact: true })).toBeVisible();
  await panel.locator("summary").filter({ hasText: "Подробности заказа #42" }).click();
  await expect(panel.getByText(/Email: fixture@example.com/)).toBeVisible();
  await expect(panel.getByText("СДЭК — до пункта выдачи · Москва", { exact: true })).toBeVisible();
  await expect(panel.getByText("Патронус · патронусов: 1", { exact: true })).toBeVisible();
  await expect(panel.getByText(/мордочек: 5/)).toHaveCount(0);
  await expect(panel.getByText(/Оплачено сертификатом: 7.?000 ₽/)).toBeVisible();
  const downloaded = page.waitForEvent("download");
  await panel.getByRole("button", { name: "Скачать фото: photo.png", exact: true }).click();
  expect((await downloaded).suggestedFilename()).toBe("photo.png");
  await panel.getByRole("button", { name: "Следующие заказы", exact: true }).click();
  await expect(panel.getByText("Страница 2", { exact: true })).toBeVisible();
  await expect(panel.getByText("Заказов пока нет.", { exact: true })).toBeVisible();
  await expect(panel.getByRole("button", { name: "Следующие заказы", exact: true })).toBeDisabled();
  await panel.getByRole("button", { name: "Предыдущие заказы", exact: true }).click();
  await expect(panel.getByRole("heading", { name: /Заказ #42/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("failed order loading can be retried without breaking stock or certificates", async ({ page }) => {
  await mockAdmin(page, "super_admin");
  let failed = false;
  await page.route("**/api/admin/orders?**", (route) => {
    if (failed) return route.fallback();
    failed = true;
    return route.fulfill({ status: 500, json: { message: "Не удалось загрузить заказы" } });
  });
  await page.goto("/admin/inventory");
  const panel = page.locator(".admin-orders");
  await expect(panel.getByRole("heading", { name: "Заказы", exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(panel.getByRole("alert")).toHaveText("Не удалось загрузить заказы");
  await panel.getByRole("button", { name: "Обновить заказы", exact: true }).click();
  await expect(panel.getByRole("heading", { name: /Заказ #42/ })).toBeVisible();
  await expect(panel.getByRole("alert")).toHaveCount(0);
});

test("an invalidated session cannot enter the dashboard using a cached role", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("token", "revoked-token");
    localStorage.setItem("role", "super_admin");
  });
  await page.route("**/api/auth/admin-session", (route) => route.fulfill({ status: 403, json: { message: "Доступ отозван" } }));
  await page.goto("/admin/inventory");
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "вход в админку", exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("token"))).toBeNull();
});
