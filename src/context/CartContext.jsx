import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { cartApi } from "../features/cart/cartApi";
import { createCartRepository } from "../features/cart/cartRepository";
import { CART_REVISION_KEY, CART_STORAGE_KEY, getCartStorage, withCartLock } from "../features/cart/cartStorage";

const CartContext = createContext(null);
export const CartProvider = ({ children }) => {
  const [repository] = useState(() => createCartRepository({ client: cartApi, storage: getCartStorage(), lock: withCartLock }));
  useEffect(() => {
    const refresh = () => { repository.load().catch(() => undefined); };
    const onStorage = (event) => {
      if (event.key === null || [CART_STORAGE_KEY, CART_REVISION_KEY].includes(event.key)) refresh();
    };
    refresh();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [repository]);
  return <CartContext.Provider value={repository}>{children}</CartContext.Provider>;
};
export const useCart = () => {
  const repository = useContext(CartContext);
  if (!repository) throw new Error("useCart должен использоваться внутри CartProvider");
  const cart = useSyncExternalStore(repository.subscribe, repository.getSnapshot, repository.getSnapshot);
  return { ...cart, addItem: repository.addItem, setQuantity: repository.setQuantity,
    removeItem: repository.removeItem, clearCart: repository.clear, reloadCart: repository.load, restoreItem: repository.restoreItem };
};
