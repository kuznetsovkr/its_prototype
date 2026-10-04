const STORAGE_KEY = "its_certificate_checkout_v1";
export const emptyCertificateBuyer = () => ({ fullName: "", phone: "", email: "", preferredContact: "", comment: "", privacyConsent: false });
export const readCertificateCheckout = (storage) => {
  try {
    const raw = (storage ?? globalThis.sessionStorage).getItem(STORAGE_KEY);
    if (!raw || raw.length > 10000) return null;
    const data = JSON.parse(raw);
    if (data.version !== 1 || !Number.isFinite(data.savedAt) || Date.now() - data.savedAt > 7 * 86_400_000
      || !Number.isInteger(data.denomination) || !data.fields || typeof data.fields !== "object") return null;
    const fields = emptyCertificateBuyer();
    for (const key of Object.keys(fields)) {
      if (typeof data.fields[key] !== typeof fields[key]) return null;
      fields[key] = data.fields[key];
    }
    const purchase = data.purchase;
    if (purchase && (!Number.isInteger(purchase.certificateId) || purchase.certificateId < 1
      || typeof purchase.certificateToken !== "string" || !purchase.certificateToken || purchase.certificateToken.length > 2048)) return null;
    return { ...data, fields };
  } catch { return null; }
};
const writeCheckoutStorage = (key, value, storage) => {
  try { (storage ?? globalThis.sessionStorage).setItem(key, value); }
  catch { throw new Error("Не удалось сохранить покупку в браузере. Разрешите хранение данных сайта и попробуйте снова."); }
};
export const saveCertificateCheckout = (data, storage) =>
  writeCheckoutStorage(STORAGE_KEY, JSON.stringify({ ...data, version: 1, savedAt: Date.now() }), storage);
export const clearCertificateCheckout = (storage) => {
  const target = storage ?? globalThis.sessionStorage;
  target.removeItem(STORAGE_KEY);
  if (target.getItem("its_payment_kind") === "certificate") target.removeItem("its_payment_kind");
};
export const markCertificatePayment = (storage) => writeCheckoutStorage("its_payment_kind", "certificate", storage);
export const markOrderPayment = (storage) => writeCheckoutStorage("its_payment_kind", "order", storage);
export const isCertificatePaymentReturn = (storage) => {
  try {
    const target = storage ?? globalThis.sessionStorage;
    return target.getItem("its_payment_kind") === "certificate" && Boolean(readCertificateCheckout(target)?.purchase);
  }
  catch { return false; }
};
