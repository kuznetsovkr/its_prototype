import { describe, expect, test } from "vitest";
import { formatPhoneNumber, splitFullName, validateRecipient } from "./recipientValidation";

const validData = {
  userData: {
    lastName: "Иванов",
    firstName: "Иван",
    middleName: "Иванович",
    phone: "+7 (900) 123-45-67",
  },
  isNoCdek: false,
  manualAddress: null,
  isCdekPickupSelected: true,
  privacyConsent: true,
};

describe("recipient validation", () => {
  test("formats a Russian phone and splits a full name", () => {
    expect(formatPhoneNumber("89001234567")).toBe("+7 (900) 123-45-67");
    expect(splitFullName("Иванов Иван Иванович")).toEqual({
      lastName: "Иванов",
      firstName: "Иван",
      middleName: "Иванович",
    });
  });

  test("requires a selected CDEK office", () => {
    expect(validateRecipient(validData)).toEqual({ isValid: true, message: "" });
    const invalid = validateRecipient({ ...validData, isCdekPickupSelected: false });
    expect(invalid.isValid).toBe(false);
    expect(invalid.message).toContain("пункт выдачи СДЭК");
  });

  test("allows a recipient without a middle name only after explicit confirmation", () => {
    const withoutMiddleName = {
      ...validData,
      userData: { ...validData.userData, middleName: "" },
    };

    const unconfirmed = validateRecipient(withoutMiddleName);
    expect(unconfirmed.isValid).toBe(false);
    expect(unconfirmed.message).toContain("отчество");

    expect(validateRecipient({
      ...withoutMiddleName,
      hasNoMiddleName: true,
    })).toEqual({ isValid: true, message: "" });
  });

  test("self-pickup does not require a CDEK office or a manual shipping address", () => {
    expect(validateRecipient({ ...validData, deliveryMethod: "pickup", isCdekPickupSelected: false, isNoCdek: true })).toEqual({ isValid: true, message: "" });
  });
  test("Russian Post requires the manually specified office, not a CDEK office", () => {
    const data = { ...validData, deliveryMethod: "russian_post", isCdekPickupSelected: false, isNoCdek: true };
    expect(validateRecipient(data).message).toContain("отделение Почты России");
    expect(validateRecipient({ ...data, postalPoint: "660075, Красноярск, ул. Маерчака, 5" }).isValid).toBe(true);
    expect(validateRecipient({ ...data, postalPoint: "Я".repeat(242) }).isValid).toBe(false);
  });
  test("a legacy manual request still requires an address with a house", () => {
    expect(validateRecipient({ ...validData, isNoCdek: true }).isValid).toBe(false);
    expect(validateRecipient({ ...validData, isNoCdek: true, manualAddress: { value: "Красноярск, Мира, 1", data: { house: "1" } } }).isValid).toBe(true);
  });
  test("an unsupported method cannot skip delivery validation", () => {
    expect(validateRecipient({ ...validData, deliveryMethod: "courier" }).isValid).toBe(false);
  });

  test("requires a valid phone and name together for another recipient", () => {
    expect(validateRecipient({ ...validData, deliveryRecipient: "Петров Пётр", recipientPhone: "" }).message)
      .toContain("телефон другого получателя");
    expect(validateRecipient({ ...validData, deliveryRecipient: "", recipientPhone: "89001234567" }).message)
      .toContain("ФИО другого получателя");
    expect(validateRecipient({ ...validData, deliveryRecipient: "Петров Пётр", recipientPhone: "123" }).isValid)
      .toBe(false);
    expect(validateRecipient({ ...validData, deliveryRecipient: "Петров Пётр", recipientPhone: "89001234567" }).isValid)
      .toBe(true);
  });
});
