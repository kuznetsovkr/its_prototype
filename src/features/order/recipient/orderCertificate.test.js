import { expect, test } from "vitest";
import { normalizeOrderCertificateCode, validateOrderCertificateCode } from "./useOrderCertificate";
import { buildOrderFormData } from "./recipientOrderPayload";

test("certificate code accepts the email formatting but rejects incomplete codes", () => {
  const code = "ITS" + "A1".repeat(16);
  expect(normalizeOrderCertificateCode("its-" + "a1".repeat(16))).toBe(code);
  expect(validateOrderCertificateCode(code)).toBe("");
  for (const value of ["", "ITS123", "OTHER" + "A1".repeat(16), "ITS" + "Я".repeat(32)]) expect(validateOrderCertificateCode(value)).toMatch(/код/);
});
test("order sends only the code, never a client certificate price or balance", () => {
  const payload = buildOrderFormData({ userData: {}, deliveryRecipient: "", recipientPhone: "", orderComment: "", email: "", preferredContact: "", deliveryComment: "",
    productType: "Худи", selectedType: "Car", privacyConsent: true, certificateCode: "ITS" + "A1".repeat(16),
    certificateDiscount: 5000, amountDue: 1, balance: 90000 });
  expect(payload.get("certificateCode")).toBe("ITS" + "A1".repeat(16));
  for (const key of ["certificateDiscount", "amountDue", "balance", "paymentAmount"]) expect(payload.has(key)).toBe(false);
});
