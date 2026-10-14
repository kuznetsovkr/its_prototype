import { describe, expect, it, vi } from "vitest";
import { createCartRepository } from "./cartRepository";
import { buildCartItemFormData } from "./cartItem";
import { CART_STORAGE_KEY, readCartAccess, writeCartAccess } from "./cartStorage";

const id = "07426c5a-e42c-4d4f-843e-04d904c585ad";
const itemId = "145d7ea8-8848-4ecd-9af6-f6c0ff8d534f";
const attachmentId = "491518ac-1e12-4f8e-8bf6-c2da1d599080";
const requestKey = "24ef78aa-21d6-4b27-bd1f-736cac521cf0";
const credentials = { id, token: "a".repeat(64), expiresAt: "2030-02-01T00:00:00.000Z" };
const memoryStorage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
};
const photo = () => new File([new Uint8Array([1, 2, 3])], "pet.png", { type: "image/png" });
const draft = (changes = {}) => ({ clothing: { type: "Худи", color: "Черный", size: "M", profile: { patronusLimit: 4 } },
  embroidery: { type: "Patronus", typeSelectionExplicit: true, patronusCount: 4, petFaceCount: 1, comment: "Мой питомец",
    uploadedImage: [photo()], price: 1, ...changes }, recipient: { email: "not-cart-data@example.com", privacyConsent: true } });
const item = { id: itemId, inventoryId: 12, productType: "Худи", color: "Черный", size: "M", embroideryType: "Patronus",
  patronusCount: 4, petFaceCount: 1, comment: "Мой питомец", quantity: 1,
  attachments: [{ id: attachmentId, originalName: "pet.png", mime: "image/png", size: 3 }] };
const fixture = (storage = memoryStorage()) => {
  const cart = { id, expiresAt: credentials.expiresAt, items: [item], addedItemId: itemId };
  const client = { createSession: vi.fn(async () => credentials), load: vi.fn(async () => cart), add: vi.fn(async () => cart),
    setQuantity: vi.fn(async () => cart), remove: vi.fn(async () => ({ ...cart, items: [] })), clear: vi.fn(async () => ({ items: [] })),
    readAttachment: vi.fn(async () => new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" })) };
  return { storage, client, cart, repository: createCartRepository({ client, storage }) };
};

describe("persistent guest cart foundation", () => {
  it("does not create a cart or contact the API just by visiting a site with no saved access", async () => {
    const { repository, client } = fixture();
    expect(repository.getSnapshot().initialized).toBe(false);
    await repository.load();
    expect(repository.getSnapshot().initialized).toBe(true);
    expect(repository.getSnapshot().items).toEqual([]);
    expect(client.load).not.toHaveBeenCalled();
    expect(client.createSession).not.toHaveBeenCalled();
  });
  it("saves only durable access before uploading; reconstructs the cart in a new repository", async () => {
    const { storage, client, repository } = fixture();
    client.add.mockImplementation(async () => {
      expect(readCartAccess(storage)).toEqual(credentials);
      return { id, expiresAt: credentials.expiresAt, items: [item], addedItemId: itemId };
    });
    expect(await repository.addItem(draft(), { requestKey, turnstileToken: "challenge" })).toBe(itemId);
    expect(client.createSession).toHaveBeenCalledWith("challenge");
    const stored = storage.getItem(CART_STORAGE_KEY);
    expect(stored).not.toContain("pet.png");
    expect(stored).not.toContain("not-cart-data");
    expect(stored).not.toContain("price");
    const restored = createCartRepository({ client, storage });
    await restored.load();
    expect(restored.getSnapshot().items).toEqual([item]);
    expect(client.createSession).toHaveBeenCalledTimes(1);
    const selection = await restored.restoreItem(itemId);
    expect(selection.clothing.type).toBe("Худи");
    expect(selection.embroidery.price).toBeNull();
    expect(selection.embroidery.uploadedImage[0]).toBeInstanceOf(File);
    expect(selection.embroidery.uploadedImage[0].name).toBe("pet.png");
    expect([...new Uint8Array(await selection.embroidery.uploadedImage[0].arrayBuffer())]).toEqual([1, 2, 3]);
  });
  it("captures independent item inputs without prices and keeps retry keys stable", async () => {
    const { repository, client } = fixture();
    const selection = draft();
    const first = repository.addItem(selection, { requestKey, turnstileToken: "first" });
    selection.clothing.type = "Футболка";
    selection.embroidery.comment = "Изменено после нажатия";
    await first;
    const form = client.add.mock.calls[0][1];
    expect(form.get("productType")).toBe("Худи");
    expect(form.get("comment")).toBe("Мой питомец");
    expect(form.has("price")).toBe(false);
    expect(form.has("profile")).toBe(false);
    expect(form.has("email")).toBe(false);
    await repository.addItem(draft(), { requestKey, turnstileToken: "retry" });
    expect(client.add.mock.calls[1][2]).toBe(requestKey);
    expect(client.createSession).toHaveBeenCalledTimes(1);
  });
  it("refuses uploads before persistence when storage is blocked or full", async () => {
    const blocked = fixture(null);
    await expect(blocked.repository.addItem(draft(), { requestKey })).rejects.toThrow("разрешите хранение");
    expect(blocked.client.createSession).not.toHaveBeenCalled();
    const full = fixture({ getItem: () => null, setItem: () => { throw new Error("QuotaExceededError"); }, removeItem: () => {} });
    await expect(full.repository.addItem(draft(), { requestKey })).rejects.toThrow("сохранить доступ");
    expect(full.client.add).not.toHaveBeenCalled();
  });
  it("keeps saved access on a network error, but forgets a server-expired cart", async () => {
    const { storage, client, repository } = fixture();
    writeCartAccess(storage, credentials);
    const offline = new Error("Сеть недоступна");
    client.load.mockRejectedValueOnce(offline);
    await expect(repository.load()).rejects.toThrow("Сеть недоступна");
    expect(readCartAccess(storage)).toEqual(credentials);
    expect(repository.getSnapshot().error).toBe("Сеть недоступна");
    client.load.mockRejectedValueOnce(Object.assign(new Error("Срок хранения истёк"), { code: "cart_expired", status: 410 }));
    await expect(repository.load()).rejects.toThrow("Срок хранения");
    expect(readCartAccess(storage)).toBeNull();
    expect(repository.getSnapshot().items).toEqual([]);
    expect(repository.getSnapshot().pending).toBe(false);
  });
  it("ignores malformed access and lets the server, not the local clock, decide expiry", async () => {
    const { storage, repository, client } = fixture();
    storage.setItem(CART_STORAGE_KEY, "{broken");
    await repository.load();
    expect(client.load).not.toHaveBeenCalled();
    writeCartAccess(storage, { ...credentials, expiresAt: "2001-01-01T00:00:00Z" });
    await repository.load();
    expect(client.load).toHaveBeenCalledTimes(1);
    expect(repository.getSnapshot().items).toEqual([item]);
  });
  it("preserves the expiry message if storage becomes blocked during removal", async () => {
    const { storage, repository, client } = fixture();
    writeCartAccess(storage, credentials);
    storage.removeItem = () => { throw new Error("SecurityError"); };
    client.load.mockRejectedValueOnce(Object.assign(new Error("Срок хранения истёк"), { code: "cart_expired" }));
    await expect(repository.load()).rejects.toThrow("Срок хранения истёк");
    expect(repository.getSnapshot().items).toEqual([]);
    expect(repository.getSnapshot().error).toBe("Срок хранения истёк");
    expect(repository.getSnapshot().pending).toBe(false);
  });
  it("serializes changes, bounds quantity and clears durable access only after success", async () => {
    const { storage, repository, client } = fixture();
    writeCartAccess(storage, credentials);
    await Promise.all([repository.setQuantity(itemId, 2), repository.removeItem(itemId)]);
    expect(client.setQuantity.mock.invocationCallOrder[0]).toBeLessThan(client.remove.mock.invocationCallOrder[0]);
    await expect(repository.setQuantity(itemId, 0)).rejects.toThrow("от 1 до 20");
    expect(client.setQuantity).toHaveBeenCalledTimes(1);
    client.clear.mockRejectedValueOnce(new Error("Сеть недоступна"));
    await expect(repository.clear()).rejects.toThrow();
    expect(readCartAccess(storage)).not.toBeNull();
    await repository.clear();
    expect(readCartAccess(storage)).toBeNull();
    expect(repository.getSnapshot().items).toEqual([]);
  });
  it("refuses incomplete, manual, oversized and over-limit selections before API calls", () => {
    expect(() => buildCartItemFormData({ ...draft(), recipient: { privacyConsent: false } }, { requestKey })).toThrow("согласие");
    expect(() => buildCartItemFormData(draft({ type: "" }), { requestKey })).toThrow("тип вышивки");
    expect(() => buildCartItemFormData(draft({ type: "custom" }), { requestKey })).toThrow("отдельной заявкой");
    expect(() => buildCartItemFormData(draft({ uploadedImage: [] }), { requestKey })).toThrow("фотографий");
    expect(() => buildCartItemFormData(draft({ patronusCount: 5 }), { requestKey })).toThrow("4 патронусов");
    expect(() => buildCartItemFormData(draft({ type: "petFace", petFaceCount: 6 }), { requestKey })).toThrow("5 мордочек");
    expect(() => buildCartItemFormData(draft({ uploadedImage: [new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.png", { type: "image/png" })] }), { requestKey })).toThrow("до 5 МБ");
    expect(() => buildCartItemFormData(draft({ uploadedImage: [new File(["svg"], "drawing.svg", { type: "image/svg+xml" })] }), { requestKey })).toThrow("JPEG");
    expect(buildCartItemFormData(draft({ type: "petFace", petFaceCount: 5, uploadedImage: Array.from({ length: 5 }, photo) }), { requestKey }).get("petFaceCount")).toBe("5");
  });
});
