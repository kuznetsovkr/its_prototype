import { describe, expect, test } from "vitest";
import { buildOrderFormData } from "./recipientOrderPayload";

describe("recipient order payload", () => {
  test("keeps checkout contact details and the selected custom font", () => {
    const payload = buildOrderFormData({
      userData: {
        firstName: "Иван",
        lastName: "Иванов",
        middleName: "Иванович",
        phone: "+7 (999) 123-45-67",
      },
      deliveryRecipient: "Петров Пётр Петрович",
      recipientPhone: "+7 (912) 345-67-89",
      orderComment: "Комментарий к заказу",
      embroideryComment: "",
      email: "buyer@example.com",
      preferredContact: "Telegram",
      deliveryComment: "Позвонить заранее",
      privacyConsent: true,
      productType: "Футболка",
      color: "Чёрный",
      size: "M",
      selectedType: "custom",
      embroideryTypeRu: "Своя вышивка — надпись",
      patronusCount: 1,
      petFaceCount: 1,
      customText: "Привет",
      customTextFont: "Georgia",
      customOption: { image: false, text: true },
      pickupPoint: "Красноярск, Мира, 1",
      manualAddress: null,
      isNoCdek: false,
      cdekData: {
        mode: "office",
        address: { code: "KRS1" },
        addressLabel: "Красноярск, Мира, 1",
      },
      uploadedImage: [],
      turnstileToken: "turnstile-response-token",
    });

    expect(payload.get("customTextFont")).toBe("Georgia");
    expect(payload.get("recipientFullName")).toBe("Петров Пётр Петрович");
    expect(payload.get("recipientPhoneDigits")).toBe("79123456789");
    expect(payload.has("deliveryCity")).toBe(false);
    expect(payload.get("email")).toBe("buyer@example.com");
    expect(payload.get("preferredContact")).toBe("Telegram");
    expect(payload.get("deliveryComment")).toBe("Позвонить заранее");
    expect(payload.get("comment")).toBe("Комментарий к заказу");
    expect(payload.get("turnstileToken")).toBe("turnstile-response-token");
  });

  test("leaves the separate recipient empty when the buyer receives the order", () => {
    const payload = buildOrderFormData({
      userData: { firstName: "Иван", lastName: "Иванов", phone: "+7 (999) 123-45-67" },
      deliveryRecipient: "",
      recipientPhone: "",
      orderComment: "",
      embroideryComment: "",
      email: "",
      preferredContact: "",
      deliveryComment: "",
      privacyConsent: true,
      productType: "Футболка",
      color: "Чёрный",
      size: "M",
      selectedType: "custom",
      embroideryTypeRu: "Своя вышивка — надпись",
      patronusCount: 0,
      petFaceCount: 0,
      customText: "Привет",
      customTextFont: "Arial",
      customOption: { image: false, text: true },
      pickupPoint: "Красноярск, Мира, 1",
      manualAddress: null,
      isNoCdek: false,
      cdekData: { mode: "office", address: { code: "KRS1" }, addressLabel: "Красноярск" },
      uploadedImage: [],
      turnstileToken: "token",
    });

    expect(payload.get("recipientFullName")).toBe("");
    expect(payload.get("recipientPhoneDigits")).toBe("");
    expect(payload.get("cdekAddress")).toBe('{"code":"KRS1"}');
  });
});
