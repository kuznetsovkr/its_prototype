import { describe, expect, it } from "vitest";
import { demoDeliveryCity, deliveryCityCoordinates, normalizeDeliveryCity } from "./deliveryCity";
import { validateRecipient } from "./recipientValidation";

describe("delivery city", () => {
  it("stores only selected canonical fields and ignores expired or incomplete values", () => {
    const city = demoDeliveryCity();
    expect(normalizeDeliveryCity({ ...city, unrelated: "value" })).toEqual(city);
    for (const invalid of [null, { label: "Красноярск" }, { ...city, token: "" }, { ...city, expiresAt: 1 }, { ...city, longitude: 181 }, { ...city, latitude: "56" }]) {
      expect(normalizeDeliveryCity(invalid)).toBeNull();
    }
    expect(deliveryCityCoordinates(city)).toEqual([92.868, 56.0106]);
    expect(deliveryCityCoordinates(null)).toBeNull();
  });
  it("requires an actual selection and refuses self-pickup in a different city", () => {
    const valid = { userData: { firstName: "Иван", lastName: "Иванов", middleName: "", phone: "+79991234567" },
      hasNoMiddleName: true, privacyConsent: true, deliveryMethod: "pickup", deliveryCity: demoDeliveryCity() };
    expect(validateRecipient(valid).isValid).toBe(true);
    expect(validateRecipient({ ...valid, deliveryCity: null }).message).toContain("город получения");
    expect(validateRecipient({ ...valid, deliveryCity: { ...valid.deliveryCity, pickup: false, name: "Москва" } }).isValid).toBe(false);
  });
});
