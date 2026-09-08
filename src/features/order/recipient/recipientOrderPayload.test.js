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
      orderComment: "Комментарий к заказу",
      embroideryComment: "",
      email: "buyer@example.com",
      preferredContact: "Telegram",
      deliveryComment: "Позвонить заранее",
      city: "Красноярск",
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
    });

    expect(payload.get("customTextFont")).toBe("Georgia");
    expect(payload.get("recipientFullName")).toBe("Петров Пётр Петрович");
    expect(payload.get("email")).toBe("buyer@example.com");
    expect(payload.get("preferredContact")).toBe("Telegram");
    expect(payload.get("deliveryComment")).toBe("Позвонить заранее");
    expect(payload.get("comment")).toBe("Комментарий к заказу");
  });
});
