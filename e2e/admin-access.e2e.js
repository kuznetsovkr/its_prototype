import { test, expect } from "@playwright/test";

const type = { id: 1, name: "Худи", code: "hoodie", price: 6500 };
const item = { id: 1, clothingTypeId: 1, productType: "Худи", color: "Зелёный", colorCode: "#448844", size: "M", quantity: 3 };

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
    if (url.pathname.startsWith("/api/pricing/config")) {
      calls.privileged.push(url.pathname);
      return route.fulfill({ json: { types: [], additional: {} } });
    }
    if (url.pathname.startsWith("/api/admin/certificates")) {
      calls.privileged.push(url.pathname);
      return route.fulfill({ json: { items: [], page: 1, pageSize: 25, total: 0 } });
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
  for (const title of ["Справочники", "Цены и параметры", "Сертификаты"]) {
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

test("super admin sees catalog, prices and certificates", async ({ page }) => {
  await mockAdmin(page, "super_admin");
  await page.goto("/admin/inventory");
  for (const title of ["Справочники", "Цены и параметры", "Складские позиции", "Сертификаты"]) {
    await expect(page.getByRole("heading", { name: title, exact: true })).toHaveCount(1);
  }
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
