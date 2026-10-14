import { expect, test } from "@playwright/test";
import { randomUUID, randomBytes } from "node:crypto";
import { Buffer } from "node:buffer";

test.setTimeout(90_000);
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWPYE6H8HwAFQgI3AM0NygAAAABJRU5ErkJggg==", "base64");
const fixturePath = "/e2e/fixtures/cart-foundation.html";
const mockCartServer = () => {
  const access = { id: randomUUID(), token: randomBytes(32).toString("hex"), expiresAt: "2030-02-01T00:00:00.000Z" };
  const items = [];
  let creates = 0;
  let failRead = false;
  let expired = false;
  const snapshot = () => ({ id: access.id, expiresAt: access.expiresAt, items });
  const mount = (context) => context.route("**/api/cart/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    const respond = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (pathname.endsWith("/session")) { creates += 1; return respond(201, access); }
    if (request.headers()["x-cart-access-token"] !== access.token) return respond(401, { code: "cart_access_required", message: "Нет доступа" });
    if (expired) return respond(410, { code: "cart_expired", message: "Срок хранения корзины истёк" });
    if (pathname.includes("/attachments/")) return route.fulfill({ status: 200, contentType: "image/png", body: png });
    if (request.method() === "POST") {
      const body = request.postDataBuffer().toString("utf8");
      const requestKey = request.headers()["idempotency-key"];
      const existing = items.find((item) => item.requestKey === requestKey);
      if (existing) return respond(200, { ...snapshot(), addedItemId: existing.id, alreadyAdded: true });
      const productType = body.includes("Футболка") ? "Футболка" : "Худи";
      const item = { id: randomUUID(), productType, color: "Черный", size: "M", embroideryType: "Patronus", patronusCount: 1,
        petFaceCount: 1, quantity: 1, comment: productType, requestKey,
        attachments: [{ id: randomUUID(), mime: "image/png", originalName: /filename="([^"]+)"/.exec(body)[1], size: png.length }] };
      items.push(item);
      return respond(201, { ...snapshot(), addedItemId: item.id });
    }
    if (request.method() === "DELETE") { items.splice(0); return respond(200, { items: [], expiresAt: null }); }
    if (failRead) return route.abort();
    return respond(200, snapshot());
  });
  return { mount, access, items, creates: () => creates, offline: () => { failRead = true; }, expire: () => { expired = true; } };
};
const open = async (page) => {
  await page.goto(fixturePath);
  await expect(page.getByRole("button", { name: "Добавить худи" })).toBeVisible({ timeout: 15_000 });
};
const selectPhoto = (page, name = "pet.png") => page.getByLabel("Фото").setInputFiles({ name, mimeType: "image/png", buffer: png });

test("basket and photo survive a browser-session restart without preserving sessionStorage or File objects", async ({ page, context, browser }) => {
  const server = mockCartServer();
  await server.mount(context);
  await open(page);
  expect(server.creates()).toBe(0);
  await selectPhoto(page);
  await page.getByRole("button", { name: "Добавить худи" }).click();
  await expect(page.getByTestId("item-count")).toHaveText("1");
  await selectPhoto(page, "second-pet.png");
  await page.getByRole("button", { name: "Добавить футболку" }).click();
  await expect(page.getByTestId("item-count")).toHaveText("2");
  expect(server.creates()).toBe(1);
  const durableState = await context.storageState();
  const stored = durableState.origins[0].localStorage.find((entry) => entry.name === "its_cart_access_v1").value;
  expect(stored).not.toContain("pet.png");
  expect(stored).not.toContain("Худи");
  await page.close();
  const reopened = await browser.newContext({ storageState: durableState });
  try {
    await server.mount(reopened);
    const restoredPage = await reopened.newPage();
    await open(restoredPage);
    await expect(restoredPage.getByTestId("item-count")).toHaveText("2");
    expect(await restoredPage.evaluate(() => sessionStorage.length)).toBe(0);
    await expect(restoredPage.getByTestId("items")).toContainText("Футболка");
    await restoredPage.getByRole("button", { name: "Восстановить фото" }).click();
    await expect(restoredPage.getByTestId("restored-name")).toHaveText("pet.png");
    await expect.poll(() => restoredPage.getByAltText("Восстановленная фотография").evaluate((image) => image.complete && image.naturalWidth === 1)).toBe(true);
    expect(server.creates()).toBe(1);
  } finally { await reopened.close(); }
});

test("a second tab refreshes after cart changes and clear removes persisted access", async ({ page, context }) => {
  const server = mockCartServer();
  await server.mount(context);
  await open(page);
  await selectPhoto(page);
  await page.getByRole("button", { name: "Добавить худи" }).click();
  await expect(page.getByTestId("item-count")).toHaveText("1");
  const second = await context.newPage();
  await open(second);
  await expect(second.getByTestId("item-count")).toHaveText("1");
  await page.getByRole("button", { name: "Добавить футболку" }).click();
  await expect(page.getByTestId("item-count")).toHaveText("2");
  await expect(second.getByTestId("item-count")).toHaveText("2");
  await second.getByRole("button", { name: "Очистить" }).click();
  await expect(second.getByTestId("item-count")).toHaveText("0");
  await expect(page.getByTestId("item-count")).toHaveText("0");
  expect(await second.evaluate(() => localStorage.getItem("its_cart_access_v1"))).toBeNull();
});

test("network failure retains access; expiry clears it with an understandable error", async ({ page, context }) => {
  const server = mockCartServer();
  await server.mount(context);
  await open(page);
  await selectPhoto(page);
  await page.getByRole("button", { name: "Добавить худи" }).click();
  await expect(page.getByTestId("item-count")).toHaveText("1");
  server.offline();
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("временно недоступна");
  expect(await page.evaluate(() => localStorage.getItem("its_cart_access_v1"))).not.toBeNull();
  server.expire();
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("Срок хранения");
  expect(await page.evaluate(() => localStorage.getItem("its_cart_access_v1"))).toBeNull();
});
