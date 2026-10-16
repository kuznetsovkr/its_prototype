import { normalizePhoneDigits } from "./recipientValidation";
import { SELF_PICKUP } from "../../../config/delivery";
import { normalizeCustomText } from "../embroidery/customTextFonts";

export const buildOrderFormData = ({
  userData, deliveryRecipient, recipientPhone, orderComment, embroideryComment, email,
  preferredContact, deliveryComment, privacyConsent, productType,
  color, size, selectedType, embroideryTypeRu, patronusCount, petFaceCount,
  customText, customTextFont, customOption, pickupPoint, manualAddress, isNoCdek, cdekData,
  uploadedImage, turnstileToken, certificateCode,
  deliveryCity,
  deliveryMethod = isNoCdek ? "manual" : "cdek", postalPoint = "",
}) => {
  const formData = new FormData();
  const recipientFullName = deliveryMethod === "pickup" ? "" : deliveryRecipient.trim();
  const comment = orderComment.trim() || String(embroideryComment || "").trim();
  const productTypeName = typeof productType === "object"
    ? productType.name ?? productType.type ?? String(productType)
    : productType;

  Object.entries({
    firstName: userData.firstName || "",
    lastName: userData.lastName || "",
    middleName: userData.middleName || "",
    phone: userData.phone || "",
    recipientPhoneDigits: deliveryMethod !== "pickup" && (recipientFullName || String(recipientPhone || "").trim())
      ? normalizePhoneDigits(recipientPhone)
      : "",
    recipientFullName,
    email: email.trim(),
    preferredContact: preferredContact.trim(),
    deliveryComment: deliveryMethod === "pickup" ? "" : deliveryComment.trim(),
    privacyConsent: String(privacyConsent),
    productType: productTypeName,
    color: color || "",
    size: size || "",
    embroideryType: selectedType || "",
    embroideryTypeRu,
    patronusCount: String(patronusCount || 0),
    petFaceCount: String(petFaceCount || 0),
    customText: selectedType === "custom" && customOption?.text
      ? normalizeCustomText(customText, customTextFont) : customText || "",
    customTextFont: customTextFont || "",
    customOption: JSON.stringify(customOption || {}),
    comment,
    deliveryMethod,
    deliveryCityToken: deliveryCity?.token || "",
    deliveryAddress: deliveryMethod === "pickup" ? SELF_PICKUP.address
      : deliveryMethod === "russian_post" ? postalPoint.trim()
      : deliveryMethod === "manual" ? manualAddress?.value || "" : pickupPoint || "",
    turnstileToken: turnstileToken || "",
  }).forEach(([key, value]) => formData.append(key, value));
  if (certificateCode) formData.append("certificateCode", certificateCode);

  if (deliveryMethod === "cdek" && cdekData) {
    formData.append("cdekMode", cdekData.mode || "");
    formData.append("cdekAddress", JSON.stringify(cdekData.address || {}));
    formData.append("cdekAddressLabel", cdekData.addressLabel || "");
  }
  (uploadedImage || []).forEach((file, index) => {
    if (file) formData.append("images", file, file.name || `image_${index}.jpg`);
  });
  return formData;
};
