export const CART_STORAGE_KEY = "its_cart_access_v1";
export const CART_REVISION_KEY = "its_cart_revision_v1";
export const isCartId = (value) => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export const getCartStorage = () => {
  try { return window.localStorage; } catch { return null; }
};
export const readCartAccess = (storage) => {
  if (!storage) return null;
  try {
    const raw = storage.getItem(CART_STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw);
    if (stored.version !== 1 || !isCartId(stored.id) || !/^[a-f0-9]{64}$/.test(stored.token)
      || !Number.isFinite(Date.parse(stored.expiresAt))) throw new Error("Invalid cart access");
    return { id: stored.id, token: stored.token, expiresAt: stored.expiresAt };
  } catch {
    try { storage.removeItem(CART_STORAGE_KEY); } catch { /* Storage may be blocked. */ }
    return null;
  }
};
export const writeCartAccess = (storage, access) => {
  if (!storage) throw new Error("Для сохранения корзины разрешите хранение данных сайта в браузере");
  if (!isCartId(access?.id) || !/^[a-f0-9]{64}$/.test(access?.token) || !Number.isFinite(Date.parse(access?.expiresAt))) {
    throw new Error("Сервер не вернул данные доступа к корзине");
  }
  try {
    storage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 1, id: access.id, token: access.token, expiresAt: access.expiresAt }));
  } catch { throw new Error("Не удалось сохранить доступ к корзине. Проверьте настройки и свободное место в браузере"); }
};

export const withCartLock = (callback) => typeof navigator !== "undefined" && navigator.locks
  ? navigator.locks.request("its-cart", callback) : callback();
