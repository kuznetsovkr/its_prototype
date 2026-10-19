import { describe, expect, it } from "vitest";
import { buildCartBuyer, buildCartDelivery, getCartCheckoutKey } from "./cartCheckout";
const memoryStorage = () => { const entries = new Map(); return { getItem: (key) => entries.get(key) || null, setItem: (key, value) => entries.set(key, value), entries }; };
describe("grouped checkout payload", () => {
  it("postal checkout sends its confirmed city and address instead of a stale CDEK point", async () => {
    const delivery = buildCartDelivery({ deliveryMethod: "russian_post", postalPoint: " 660000, Мира, 1 ", deliveryCity: { token: "city-token" }, officeCode: "OLD-CDEK" });
    expect(delivery).toEqual({ deliveryMethod: "russian_post", postalPoint: "660000, Мира, 1", deliveryCityToken: "city-token" });
    const storage = memoryStorage();
    const payload = { ...delivery, revision: 1, certificateCode: "", buyer: {} };
    const key = await getCartCheckoutKey("cart", payload, storage);
    expect(await getCartCheckoutKey("cart", payload, storage)).toBe(key);
    expect(await getCartCheckoutKey("cart", { ...payload, postalPoint: "Другое отделение" }, storage)).not.toBe(key);
    expect(buildCartDelivery({ deliveryMethod: "cdek", officeCode: "KRS1", postalPoint: "старое отделение" })).toEqual({ officeCode: "KRS1" });
  });
  it("sends contacts and one recipient phone, not merchandise amounts or trusted parcel sizes", () => {
    const buyer = buildCartBuyer({ userData: { firstName: "Иван", phone: "+7 (999) 123-45-67" }, deliveryRecipient: "Петров Пётр", recipientPhone: "89998887766", privacyConsent: true });
    expect(buyer.recipientPhoneDigits).toBe("79998887766");
    expect(buyer.privacyConsent).toBe(true);
    expect(buyer).not.toHaveProperty("price");
    expect(buyer).not.toHaveProperty("packages");
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
