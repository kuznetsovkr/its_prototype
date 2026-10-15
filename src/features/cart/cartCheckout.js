import { normalizePhoneDigits } from "../order/recipient/recipientValidation";
import { isCartId } from "./cartStorage";

const ATTEMPT_KEY = "its_cart_checkout_attempt_v1";
export const buildCartBuyer = ({ userData, deliveryRecipient, recipientPhone, email, preferredContact, orderComment, deliveryComment, privacyConsent }) => ({
  firstName: userData.firstName || "", lastName: userData.lastName || "", middleName: userData.middleName || "", phone: userData.phone || "",
  recipientFullName: String(deliveryRecipient || "").trim(),
  recipientPhoneDigits: deliveryRecipient?.trim() || recipientPhone?.trim() ? normalizePhoneDigits(recipientPhone) : "",
  email: String(email || "").trim(), preferredContact: String(preferredContact || "").trim(),
  comment: String(orderComment || "").trim(), deliveryComment: String(deliveryComment || "").trim(), privacyConsent: privacyConsent === true,
});
export const getCartCheckoutKey = async (cartId, payload, storage) => {
  if (!storage) {
    try { storage = window.sessionStorage; } catch { throw new Error("Для надёжного оформления разрешите сохранение данных сайта в браузере"); }
  }
  // Store only a digest and a random attempt ID, never another copy of contact
  // details or the certificate code. Keep the attempt stable across reloads.
  const fingerprint = { cartId, revision: payload.revision, officeCode: payload.officeCode, certificateCode: payload.certificateCode, buyer: payload.buyer };
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(fingerprint)));
  const signature = Array.from(new Uint8Array(hash), (value) => value.toString(16).padStart(2, "0")).join("");
  try {
    const saved = JSON.parse(storage.getItem(ATTEMPT_KEY) || "null");
    if (saved?.signature === signature && isCartId(saved.key)) return saved.key;
  } catch { /* Create a fresh key when no valid attempt is stored. */ }
  const key = crypto.randomUUID();
  try { storage.setItem(ATTEMPT_KEY, JSON.stringify({ signature, key })); }
  catch { throw new Error("Для надёжного оформления разрешите сохранение данных сайта в браузере"); }
  return key;
};

export const cartWidgetPackages = (items) => items.flatMap((item) => item.parcel
  ? Array.from({ length: item.quantity }, () => ({ width: item.parcel.width, height: item.parcel.height, length: item.parcel.length, weight: item.parcel.weight / 1000 }))
  : []);
