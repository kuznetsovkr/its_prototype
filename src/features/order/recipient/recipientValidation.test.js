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
});
