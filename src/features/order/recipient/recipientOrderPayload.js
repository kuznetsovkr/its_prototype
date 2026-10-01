import { normalizePhoneDigits } from "./recipientValidation";

export const buildOrderFormData = ({
  userData, deliveryRecipient, recipientPhone, orderComment, embroideryComment, email,
  preferredContact, deliveryComment, privacyConsent, productType,
  color, size, selectedType, embroideryTypeRu, patronusCount, petFaceCount,
  customText, customTextFont, customOption, pickupPoint, manualAddress, isNoCdek, cdekData,
  uploadedImage, turnstileToken,
}) => {
  const formData = new FormData();
  const recipientFullName = deliveryRecipient.trim();
  const comment = orderComment.trim() || String(embroideryComment || "").trim();
  const productTypeName = typeof productType === "object"
    ? productType.name ?? productType.type ?? String(productType)
    : productType;

  Object.entries({
    firstName: userData.firstName || "",
    lastName: userData.lastName || "",
    middleName: userData.middleName || "",
    phone: userData.phone || "",
    recipientPhoneDigits: deliveryRecipient.trim() || String(recipientPhone || "").trim()
      ? normalizePhoneDigits(recipientPhone)
      : "",
    recipientFullName,
    email: email.trim(),
    preferredContact: preferredContact.trim(),
    deliveryComment: deliveryComment.trim(),
    privacyConsent: String(privacyConsent),
    productType: productTypeName,
    color: color || "",
    size: size || "",
    embroideryType: selectedType || "",
    embroideryTypeRu,
    patronusCount: String(patronusCount || 0),
    petFaceCount: String(petFaceCount || 0),
    customText: customText || "",
    customTextFont: customTextFont || "",
    customOption: JSON.stringify(customOption || {}),
    comment,
    deliveryAddress: pickupPoint || manualAddress?.value || "",
    turnstileToken: turnstileToken || "",
  }).forEach(([key, value]) => formData.append(key, value));

  if (!isNoCdek && cdekData) {
    formData.append("cdekMode", cdekData.mode || "");
    formData.append("cdekAddress", JSON.stringify(cdekData.address || {}));
    formData.append("cdekAddressLabel", cdekData.addressLabel || "");
  }
  (uploadedImage || []).forEach((file, index) => {
    if (file) formData.append("images", file, file.name || `image_${index}.jpg`);
  });
  return formData;
};
