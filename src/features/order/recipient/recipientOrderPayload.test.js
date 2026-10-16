import { describe, expect, test } from "vitest";
import { buildOrderFormData } from "./recipientOrderPayload";
import { CUSTOM_TEXT_FONTS } from "../embroidery/customTextFonts";

const deliveryBase = {
  userData: { firstName: "Иван", lastName: "Иванов", phone: "+7 (999) 123-45-67" },
  deliveryRecipient: "Петров Пётр", recipientPhone: "+7 (912) 345-67-89", orderComment: "", email: "", preferredContact: "",
  deliveryComment: "Позвонить другому получателю", privacyConsent: true, productType: "Футболка", color: "Чёрный", size: "M",
  selectedType: "Car", pickupPoint: "Старый ПВЗ", cdekData: { mode: "office", address: { code: "OLD" } }, uploadedImage: [],
};

describe("recipient order payload", () => {
  test("sends only the server-issued city receipt, not a client-supplied city name or coordinates", () => {
    const payload = buildOrderFormData({ ...deliveryBase, deliveryCity: { token: "signed-city-receipt", name: "Город", longitude: 37, latitude: 55 } });
    expect(payload.get("deliveryCityToken")).toBe("signed-city-receipt");
    for (const field of ["deliveryCity", "longitude", "latitude"]) expect(payload.has(field)).toBe(false);
  });
  test("keeps each font's canonical value rather than its CSS alias or label", () => {
    for (const customTextFont of CUSTOM_TEXT_FONTS) {
      const payload = buildOrderFormData({ ...deliveryBase, selectedType: "custom", customTextFont,
        customOption: { image: false, text: true }, customText: "Love" });
      expect(payload.get("customTextFont")).toBe(customTextFont);
      expect(payload.get("customText")).toBe(customTextFont === "Onest Bold" ? "love" : "Love");
    }
  });
  test("sends lowercase Onest and unchanged Cyrillic Swanky inscriptions, not a display-only transform", () => {
    const custom = { ...deliveryBase, selectedType: "custom", customOption: { image: false, text: true }, customText: "ПрИвЕт, ЁЖИК! LOVE\n2026" };
    expect(buildOrderFormData({ ...custom, customTextFont: "Onest Bold" }).get("customText")).toBe("привет, ёжик! love\n2026");
    expect(buildOrderFormData({ ...custom, customTextFont: "Swanky and Moo Moo" }).get("customText")).toBe(custom.customText);
    expect(buildOrderFormData({ ...custom, selectedType: "Car", customTextFont: "Onest Bold" }).get("customText")).toBe(custom.customText);
  });
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
      customTextFont: "Onest Bold",
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

    expect(payload.get("customTextFont")).toBe("Onest Bold");
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
      customTextFont: "Onest Bold",
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

  test("postal requests never carry a stale CDEK office or its address", () => {
    const payload = buildOrderFormData({ ...deliveryBase, deliveryMethod: "russian_post", postalPoint: "660075, Красноярск, Маерчака, 5" });
    expect(payload.get("deliveryMethod")).toBe("russian_post");
    expect(payload.get("deliveryAddress")).toBe("660075, Красноярск, Маерчака, 5");
    expect(payload.has("cdekMode")).toBe(false);
    expect(payload.has("cdekAddress")).toBe(false);
    expect(payload.get("recipientPhoneDigits")).toBe("79123456789");
  });
  test("pickup uses the fixed shop address and does not carry hidden recipient fields", () => {
    const payload = buildOrderFormData({ ...deliveryBase, deliveryMethod: "pickup" });
    expect(payload.get("deliveryAddress")).toBe("Красноярск, ул. Ломоносова, 11");
    expect(payload.get("recipientFullName")).toBe("");
    expect(payload.get("recipientPhoneDigits")).toBe("");
    expect(payload.get("deliveryComment")).toBe("");
    expect(payload.has("cdekMode")).toBe(false);
  });
  test("legacy manual addresses override a stale pickup-point label", () => {
    const payload = buildOrderFormData({ ...deliveryBase, isNoCdek: true, manualAddress: { value: "Новый адрес" } });
    expect(payload.get("deliveryMethod")).toBe("manual");
    expect(payload.get("deliveryAddress")).toBe("Новый адрес");
    expect(payload.has("cdekAddress")).toBe(false);
  });
});
