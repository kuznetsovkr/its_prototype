import { describe, expect, it } from "vitest";
import { buildCartBuyer, cartWidgetPackages, getCartCheckoutKey } from "./cartCheckout";
const memoryStorage = () => { const entries = new Map(); return { getItem: (key) => entries.get(key) || null, setItem: (key, value) => entries.set(key, value), entries }; };
describe("grouped checkout payload", () => {
  it("sends contacts and one recipient phone, not merchandise amounts or trusted parcel sizes", () => {
    const buyer = buildCartBuyer({ userData: { firstName: "Иван", phone: "+7 (999) 123-45-67" }, deliveryRecipient: "Петров Пётр", recipientPhone: "89998887766", privacyConsent: true });
    expect(buyer.recipientPhoneDigits).toBe("79998887766");
    expect(buyer.privacyConsent).toBe(true);
    expect(buyer).not.toHaveProperty("price");
    expect(buyer).not.toHaveProperty("packages");
  });
  it("uses a package per garment unit, converting server grams only for the widget", () => {
    expect(cartWidgetPackages([{ quantity: 2, parcel: { width: 35, height: 35, length: 7, weight: 800 } }]))
      .toEqual(Array.from({ length: 2 }, () => ({ width: 35, height: 35, length: 7, weight: .8 })));
  });
  it("keeps retries stable across instances and stores no clear-text contacts or certificate code", async () => {
    const storage = memoryStorage();
    const payload = { revision: 2, officeCode: "KRS1", certificateCode: "PRIVATE-CODE", buyer: { email: "buyer@example.com" }, quoteHash: "old" };
    const first = await getCartCheckoutKey("cart", payload, storage);
    expect(await getCartCheckoutKey("cart", { ...payload, quoteHash: "new", turnstileToken: "refreshed" }, storage)).toBe(first);
    expect(JSON.stringify([...storage.entries.values()])).not.toContain("PRIVATE-CODE");
    expect(JSON.stringify([...storage.entries.values()])).not.toContain("buyer@example.com");
    expect(await getCartCheckoutKey("cart", { ...payload, revision: 3 }, storage)).not.toBe(first);
  });
});
