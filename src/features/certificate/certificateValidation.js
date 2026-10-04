import { normalizePhoneDigits } from "../order/recipient/recipientValidation";
export const validateCertificateBuyer = (fields) => {
  const fullName = fields.fullName.trim().replace(/\s+/g, " ");
  if (!/^[\p{L}][\p{L}\p{M}'’\- ]*$/u.test(fullName) || fullName.split(" ").length < 2 || fullName.length > 200) return "Укажите фамилию и имя покупателя";
  if (!/^7\d{10}$/.test(normalizePhoneDigits(fields.phone))) return "Введите корректный номер телефона";
  const email = fields.email.trim().toLowerCase();
  const [localPart, domain = ""] = email.split("@");
  if (email.length > 254 || !/^[a-z0-9.!#$%&'*+/=?^_{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(email)
    || localPart.length > 64 || localPart.startsWith(".") || localPart.endsWith(".")
    || email.includes("..") || domain.split(".").some((label) => label.length > 63)) return "Введите корректный e-mail для получения сертификата";
  if (!fields.privacyConsent) return "Необходимо согласие на обработку персональных данных";
  return "";
};
