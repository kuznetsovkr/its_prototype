export const cleanPhone = (value) => (value || "").replace(/\D/g, "");

export const normalizePhoneDigits = (value) => {
  const digits = cleanPhone(value);
  if (!digits) return "";
  if (digits.length === 10) return `7${digits}`;
  if (digits.length === 11 && digits.startsWith("8")) return `7${digits.slice(1)}`;
  return digits;
};

export const formatPhoneNumber = (value) => {
  let numbers = cleanPhone(value);
  if (numbers.startsWith("8")) numbers = `7${numbers.slice(1)}`;
  else if (!numbers.startsWith("7")) numbers = `7${numbers}`;
  numbers = numbers.slice(0, 11);
  return "+7 " +
    (numbers[1] ? `(${numbers.slice(1, 4)}` : "") +
    (numbers[4] ? `) ${numbers.slice(4, 7)}` : "") +
    (numbers[7] ? `-${numbers.slice(7, 9)}` : "") +
    (numbers[9] ? `-${numbers.slice(9, 11)}` : "");
};

export const joinFullName = (data = {}) =>
  [data.lastName, data.firstName, data.middleName].filter(Boolean).join(" ");

export const splitFullName = (value) => {
  const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
  return {
    lastName: parts[0] || "",
    firstName: parts[1] || "",
    middleName: parts.slice(2).join(" "),
  };
};

export const hasFullManualAddress = (manualAddress) => {
  if (!manualAddress?.data) return false;
  const { house, block, flat } = manualAddress.data;
  return Boolean(house || block || flat);
};

export const validateRecipient = ({
  userData,
  isNoCdek,
  manualAddress,
  isCdekPickupSelected,
  privacyConsent,
}) => {
  const missing = [];
  if (!userData.lastName.trim()) missing.push("фамилию");
  if (!userData.firstName.trim()) missing.push("имя");
  if (!userData.middleName.trim()) missing.push("отчество");
  if (!userData.phone.trim()) missing.push("телефон");

  if (isNoCdek) {
    if (!manualAddress?.value || !hasFullManualAddress(manualAddress)) missing.push("полный адрес до дома");
  } else if (!isCdekPickupSelected) {
    missing.push("пункт выдачи СДЭК");
  }

  const phoneDigits = cleanPhone(userData.phone);
  const isPhoneValid = phoneDigits.length === 11 && phoneDigits.startsWith("7");
  if (!isPhoneValid) missing.push("корректный телефон");
  if (!privacyConsent) missing.push("согласие на обработку данных");

  const last = missing.at(-1);
  const prefix = missing.slice(0, -1);
  return {
    isValid: missing.length === 0,
    message: missing.length === 0
      ? ""
      : `Пожалуйста, заполните ${prefix.length ? `${prefix.join(", ")} и ${last}` : last}`,
  };
};

export const deriveGoodsPreset = (productType) => {
  const name = String(typeof productType === "object"
    ? productType?.name || productType?.type || ""
    : productType || "").toLowerCase();
  let preset = { width: 35, height: 35, length: 7, weight: 0.8 };
  if (["t-shirt", "tshirt", "tee"].some((part) => name.includes(part))) {
    preset = { width: 30, height: 20, length: 3, weight: 0.3 };
  }
  return { ...preset, weight_grams: Math.round(preset.weight * 1000) };
};
