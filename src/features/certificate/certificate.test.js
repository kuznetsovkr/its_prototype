import { describe, expect, it } from "vitest";
import { validateCertificateBuyer } from "./certificateValidation";
import { clearCertificateCheckout, emptyCertificateBuyer, isCertificatePaymentReturn, markCertificatePayment, markOrderPayment, readCertificateCheckout, saveCertificateCheckout } from "./certificateStorage";
const buyer = { ...emptyCertificateBuyer(), fullName: "Иванов Иван", phone: "+7 (999) 123-45-67", email: "buyer@example.com", privacyConsent: true };
const memoryStorage = () => {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) };
};
describe("certificate buyer", () => {
  it("accepts a buyer without a patronymic and normalizes existing phone formats", () => {
    expect(validateCertificateBuyer(buyer)).toBe("");
    expect(validateCertificateBuyer({ ...buyer, phone: "89991234567" })).toBe("");
  });
  it("requires name, phone, email and consent", () => {
    for (const [key, value] of [["fullName", "Иван"], ["phone", "123"], ["email", ""], ["email", "buyer,other@example.com"], ["privacyConsent", false]]) {
      expect(validateCertificateBuyer({ ...buyer, [key]: value })).not.toBe("");
    }
  });
});
describe("certificate checkout storage and payment routing", () => {
  it("keeps buyer access separate from ordinary order payment", () => {
    const storage = memoryStorage();
    saveCertificateCheckout({ denomination: 2000, fields: buyer, requestKey: "fixture", purchase: { certificateId: 42, certificateToken: "buyer-token" } }, storage);
    expect(readCertificateCheckout(storage).purchase.certificateId).toBe(42);
    markCertificatePayment(storage);
    expect(isCertificatePaymentReturn(storage)).toBe(true);
    markOrderPayment(storage);
    expect(isCertificatePaymentReturn(storage)).toBe(false);
    clearCertificateCheckout(storage);
    expect(readCertificateCheckout(storage)).toBeNull();
    expect(storage.getItem("its_payment_kind")).toBe("order");
    markCertificatePayment(storage);
    clearCertificateCheckout(storage);
    expect(storage.getItem("its_payment_kind")).toBeNull();
  });
  it("rejects an expired receipt or invalid token and cannot infer payment from the marker", () => {
    const storage = memoryStorage();
    markCertificatePayment(storage);
    expect(isCertificatePaymentReturn(storage)).toBe(false);
    for (const extra of [{ savedAt: 1 }, { purchase: { certificateId: 0, certificateToken: "" } }]) {
      storage.setItem("its_certificate_checkout_v1", JSON.stringify({ version: 1, savedAt: Date.now(), denomination: 2000, fields: buyer, ...extra }));
      expect(readCertificateCheckout(storage)).toBeNull();
    }
  });
  it("treats corrupted browser storage as an absent draft", () => {
    const storage = { getItem: () => { throw new Error("Storage unavailable"); } };
    expect(readCertificateCheckout(storage)).toBeNull();
  });
  it("refuses to proceed without saving the purchase request safely", () => {
    const storage = { setItem: () => { throw new Error("Storage unavailable"); } };
    expect(() => saveCertificateCheckout({ denomination: 2000, fields: buyer }, storage)).toThrow("Разрешите хранение данных сайта");
  });
});
