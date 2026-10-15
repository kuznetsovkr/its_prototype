import { buildCartItemFormData } from "./cartItem";
import { CART_REVISION_KEY, CART_STORAGE_KEY, readCartAccess, writeCartAccess } from "./cartStorage";

export const createCartRepository = ({ client, storage, lock = (callback) => callback() }) => {
  let state = { id: null, items: [], revision: 0, checkout: null, merchandisePrice: null, expiresAt: null, pending: false, initialized: false, error: null };
  let queue = Promise.resolve();
  const listeners = new Set();
  const publish = (next) => {
    state = { ...state, ...next };
    listeners.forEach((listener) => listener());
  };
  const forget = (expectedId) => {
    try {
      if (!expectedId || readCartAccess(storage)?.id === expectedId) storage?.removeItem(CART_STORAGE_KEY);
    } catch { /* Preserve the server error when browser storage becomes blocked. */ }
  };
  const revision = () => {
    try { storage?.setItem(CART_REVISION_KEY, crypto.randomUUID()); } catch { /* Access was already durably saved. */ }
  };
  const accept = (cart, access) => {
    if (!cart || cart.id !== access.id || !Array.isArray(cart.items)) throw new Error("Сервер вернул некорректную корзину");
    // A quota failure updating the expiry must not hide a successfully saved
    // item. The original access token was saved before uploading any files.
    try { writeCartAccess(storage, { ...access, expiresAt: cart.expiresAt }); } catch { /* Keep the existing access. */ }
    publish({ id: cart.id, items: cart.items, revision: cart.revision ?? 0, checkout: cart.checkout || null,
      merchandisePrice: cart.merchandisePrice ?? null, expiresAt: cart.expiresAt, error: null });
  };
  const run = (operation) => {
    const task = queue.then(() => lock(async () => {
      publish({ pending: true, error: null });
      try { return await operation(); }
      catch (error) {
        if (["cart_expired", "cart_not_found", "cart_access_required"].includes(error.code)) {
          // Only the server, not the browser clock, decides whether a cart expired.
          forget(state.id || readCartAccess(storage)?.id);
          publish({ id: null, items: [], revision: 0, checkout: null, merchandisePrice: null, expiresAt: null });
        }
        publish({ error: error.message || "Не удалось обработать корзину" });
        throw error;
      } finally { publish({ pending: false }); }
    }));
    queue = task.catch(() => undefined);
    return task;
  };
  const requireAccess = () => {
    const access = readCartAccess(storage);
    if (!access) throw new Error("Сохранённая корзина не найдена");
    return access;
  };

  return {
    getSnapshot: () => state,
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    load: () => run(async () => {
      const access = readCartAccess(storage);
      if (!access) { publish({ id: null, items: [], revision: 0, checkout: null, merchandisePrice: null, expiresAt: null }); return; }
      accept(await client.load(access), access);
    }).finally(() => publish({ initialized: true })),
    addItem: (draft, options) => {
      // Capture a complete item before awaiting network or changing the current
      // constructor. A retry must reuse options.requestKey.
      let formData;
      try { formData = buildCartItemFormData(draft, options); }
      catch (error) { publish({ error: error.message }); return Promise.reject(error); }
      return run(async () => {
        if (!storage) throw new Error("Для сохранения корзины разрешите хранение данных сайта в браузере");
        let access = readCartAccess(storage);
        if (!access) {
          access = await client.createSession(options.turnstileToken || "");
          // Fail before file upload if durable storage is blocked/full.
          writeCartAccess(storage, access);
        }
        const cart = await client.add(access, formData, options.requestKey);
        accept(cart, access);
        revision();
        return cart.addedItemId;
      });
    },
    setQuantity: (itemId, quantity) => run(async () => {
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) throw new Error("Количество изделий должно быть целым числом от 1 до 20");
      const access = requireAccess();
      accept(await client.setQuantity(access, itemId, quantity), access);
      revision();
    }),
    removeItem: (itemId) => run(async () => {
      const access = requireAccess();
      accept(await client.remove(access, itemId), access);
      revision();
    }),
    quote: (input) => client.quote(requireAccess(), input),
    checkout: (input, requestKey) => run(async () => {
      const access = requireAccess();
      try {
        const order = await client.checkout(access, input, requestKey);
        // Preserve the confirmed order even if a subsequent cart refresh fails.
        publish({ checkout: order, error: null });
        revision();
        return order;
      } catch (error) {
        // The POST may have committed before its response was lost. Restore
        // its order token instead of starting another checkout or forgetting it.
        try { accept(await client.load(access), access); } catch { /* Keep access and the original failure. */ }
        throw error;
      }
    }),
    cancelCheckout: () => run(async () => {
      const access = requireAccess();
      accept(await client.cancelCheckout(access), access);
      revision();
    }),
    clear: () => run(async () => {
      const access = readCartAccess(storage);
      if (access) await client.clear(access);
      forget(access?.id);
      publish({ id: null, items: [], revision: 0, checkout: null, merchandisePrice: null, expiresAt: null });
      revision();
    }),
    restoreItem: (itemId) => run(async () => {
      const access = requireAccess();
      accept(await client.load(access), access);
      const item = state.items.find((entry) => entry.id === itemId);
      if (!item) throw new Error("Изделие не найдено в корзине");
      const uploadedImage = await Promise.all(item.attachments.map(async (attachment) => {
        const blob = await client.readAttachment(access, item.id, attachment.id);
        return new File([blob], attachment.originalName, { type: attachment.mime });
      }));
      return {
        clothing: { type: item.productType, color: item.color, size: item.size, previewSrc: item.imageUrl || "", previewAlt: item.productType },
        embroidery: { type: item.embroideryType, typeSelectionExplicit: true, patronusCount: item.patronusCount,
          petFaceCount: item.petFaceCount, comment: item.comment, uploadedImage, price: null, customOption: { image: false, text: false } },
      };
    }),
  };
};
