import { describe, expect, it } from "vitest";
import { CONSTRUCTOR_DRAFT_KEY, CONSTRUCTOR_DRAFT_TTL, constructorSnapshot, createConstructorDraftStore } from "./constructorDraft";

const id = "11111111-1111-4111-8111-111111111111";
const order = () => ({ cartItemKey: id, clothing: { type: "Худи", color: "Чёрный", size: "M", previewSrc: "blob:private", profile: { price: 999 } },
  embroidery: { type: "Car", typeSelectionExplicit: true, comment: "Вид спереди", price: 999, uploadedImage: [{ name: "car.jpg", size: 123, lastModified: 456, bytes: "private" }] },
  recipient: { email: "buyer@example.com", phone: "79999999999", certificateCode: "secret", privacyConsent: true } });
const memory = () => { const map = new Map(); return { getItem: (key) => map.get(key) || null, setItem: (key, value) => map.set(key, value), removeItem: (key) => map.delete(key) }; };
describe("unfinished constructor persistence", () => {
  it("starts only after all garment choices and stores an explicit privacy-safe allowlist", () => {
    const input = order();
    expect(constructorSnapshot({ ...input, clothing: { type: "Худи", color: "Чёрный" } })).toBeNull();
    expect(constructorSnapshot({ ...input, clothing: { ...input.clothing, type: {} } })).toBeNull();
    const saved = constructorSnapshot(input);
    expect(saved.clothing).toEqual({ type: "Худи", color: "Чёрный", size: "M" });
    expect(saved.embroidery.type).toBe("Car");
    expect(saved.uploadFiles).toEqual([{ name: "car.jpg", size: 123, lastModified: 456 }]);
    expect(JSON.stringify(saved)).not.toMatch(/private|price|recipient|buyer@example|secret|privacyConsent/);
    expect(constructorSnapshot({ ...input, embroidery: { type: "Patronus" } }).embroidery.type).toBe("");
  });
  it("restores after a browser restart; only a meaningful change extends 30 days", () => {
    const storage = memory(); let time = 1000;
    const store = createConstructorDraftStore({ storage, now: () => time });
    expect(store.save(order()).error).toBe("");
    const first = storage.getItem(CONSTRUCTOR_DRAFT_KEY);
    time += 100;
    store.save({ ...order(), clothing: { ...order().clothing, profile: { price: 50 } }, recipient: { email: "changed@example.com" } });
    expect(storage.getItem(CONSTRUCTOR_DRAFT_KEY)).toBe(first);
    const restored = createConstructorDraftStore({ storage, now: () => time }).initialDraft;
    expect(restored.cartItemKey).toBe(id);
    expect(restored.embroidery.comment).toBe("Вид спереди");
    store.save({ ...order(), embroidery: { ...order().embroidery, comment: "Вид сбоку" } });
    expect(JSON.parse(storage.getItem(CONSTRUCTOR_DRAFT_KEY)).expiresAt).toBe(time + CONSTRUCTOR_DRAFT_TTL);
  });
  it("expires exactly at 30 days and does not restore malformed/oversized values", () => {
    const storage = memory();
    let time = 1000;
    const active = createConstructorDraftStore({ storage, now: () => time });
    active.save(order());
    const original = storage.getItem(CONSTRUCTOR_DRAFT_KEY);
    expect(createConstructorDraftStore({ storage, now: () => 1000 + CONSTRUCTOR_DRAFT_TTL - 1 }).initialDraft).not.toBeNull();
    expect(createConstructorDraftStore({ storage, now: () => 1000 + CONSTRUCTOR_DRAFT_TTL }).initialDraft).toBeNull();
    time += CONSTRUCTOR_DRAFT_TTL;
    active.save({ ...order(), recipient: { email: "only-contacts-changed@example.com" } });
    expect(storage.getItem(CONSTRUCTOR_DRAFT_KEY)).toBe(original);
    for (const raw of ["broken", JSON.stringify({ version: 99 }), "x".repeat(25001)]) {
      storage.setItem(CONSTRUCTOR_DRAFT_KEY, raw);
      expect(createConstructorDraftStore({ storage }).initialDraft).toBeNull();
    }
  });
  it("completion and reset retire the draft instead of resurrecting it from another tab", () => {
    const storage = memory(); const first = createConstructorDraftStore({ storage });
    first.save(order());
    const second = createConstructorDraftStore({ storage });
    first.save({ ...order(), recipient: { savedOrder: { orderId: 1 } } });
    expect(createConstructorDraftStore({ storage }).initialDraft).toBeNull();
    expect(second.save(order()).error).toContain("другой вкладке");
    expect(createConstructorDraftStore({ storage }).initialDraft).toBeNull();
  });
  it("stale tabs do not overwrite or remove a newer draft", () => {
    const storage = memory(); const first = createConstructorDraftStore({ storage });
    first.save(order()); const second = createConstructorDraftStore({ storage });
    first.save({ ...order(), clothing: { ...order().clothing, size: "L" } });
    expect(second.checkConflict()).toContain("другой вкладке");
    expect(second.save(null).error).toContain("другой вкладке");
    expect(createConstructorDraftStore({ storage }).initialDraft.clothing.size).toBe("L");
  });
  it("blocked or full storage never crashes the in-memory constructor and reports a useful error", () => {
    for (const storage of [null, { getItem: () => { throw Error("blocked"); } }, { getItem: () => null, setItem: () => { throw Error("full"); } }]) {
      const store = createConstructorDraftStore({ storage });
      expect(store.initialDraft).toBeNull();
      expect(store.save(order()).error).toContain("Не удалось сохранить");
    }
  });
});
