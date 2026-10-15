import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useOrder } from "../../context/OrderContext";
import { buildCartItemFormData } from "./cartItem";
import { cartPaymentBlocked, constructorCartItem, currentCartItem } from "./cartPresentation";
import { confirmDiscardConstructor } from "./ConstructorDraftNotice";

export const useRecipientCart = ({ turnstile, privacyConsent, isCheckoutLocked, isPaying }) => {
  const cart = useCart();
  const { order, resetCurrentItem, constructorDraftError } = useOrder();
  const navigate = useNavigate();
  const location = useLocation();
  const cartOnly = new URLSearchParams(location.search).get("cart") === "1";
  const isGroup = cartOnly || (order.embroidery.type !== "custom" && (cart.items.length > 0 || Boolean(cart.checkout)));
  const activeCheckout = isGroup ? cart.checkout : null;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const operation = useRef(false);
  const alreadySaved = cart.items.some((item) => item.requestKey === order.cartItemKey);
  useEffect(() => {
    if (!alreadySaved || !cart.initialized || cart.pending || saving || cartOnly || isCheckoutLocked || activeCheckout) return;
    // Reconcile an accepted upload whose response was lost, including a reload
    // without File objects. Do not ask the user to upload it again.
    resetCurrentItem();
    navigate("/order", { replace: true, state: { cartItemAdded: true } });
  }, [alreadySaved, cart.initialized, cart.pending, saving, cartOnly, isCheckoutLocked, activeCheckout, resetCurrentItem, navigate]);
  const draft = { ...order, recipient: { ...order.recipient, privacyConsent } };
  let addError = "";
  if (cartOnly) addError = "Сначала создайте новое изделие";
  else if (isCheckoutLocked || cart.checkout) addError = "Заказ уже создан. Завершите оплату или отмените оформление корзины";
  else {
    try { buildCartItemFormData(draft, { requestKey: order.cartItemKey }); }
    catch (validationError) { addError = validationError.message; }
  }
  if (!addError && !turnstile.isSatisfied) addError = "Подтвердите, что изделие добавляет человек";
  const busy = saving || cart.pending || isPaying;
  const saveCurrentItem = async (forCheckout = false) => {
    if (operation.current || busy) return;
    if (addError) { setError(addError); return; }
    operation.current = true;
    setSaving(true);
    setError("");
    try {
      await cart.addItem(draft, { requestKey: order.cartItemKey, turnstileToken: turnstile.token });
      // Only a confirmed server save releases the browser's File objects.
      resetCurrentItem();
      navigate(forCheckout ? "/recipient?cart=1" : "/order", { replace: true, state: { cartItemAdded: true } });
    } catch (saveError) { setError(saveError.message); }
    finally { turnstile.reset(); operation.current = false; setSaving(false); }
  };
  const changeQuantity = async (id, quantity) => {
    if (busy || isCheckoutLocked || cart.checkout) return;
    setError("");
    try { await cart.setQuantity(id, quantity); } catch (changeError) { setError(changeError.message); }
  };
  const removeItem = async (id) => {
    if (busy || isCheckoutLocked || cart.checkout) return;
    setError("");
    try { await cart.removeItem(id); } catch (removeError) { setError(removeError.message); }
  };
  const reloadCart = async () => {
    setError("");
    await cart.reloadCart();
  };
  const cancelCheckout = async () => {
    if (busy) return;
    setError("");
    try { await cart.cancelCartCheckout(); } catch (cancelError) { setError(cancelError.message); }
  };
  const current = cartOnly || alreadySaved ? null : currentCartItem(order);
  const draftItem = cartOnly && !alreadySaved && !activeCheckout ? constructorCartItem(order) : null;
  return { ...cart, isGroup, activeCheckout, cartOnly, alreadySaved, current, draftItem, constructorDraftError, busy, saving, addError, canAdd: !addError && !busy && cart.initialized,
    discardDraft: () => { if (confirmDiscardConstructor(order)) resetCurrentItem(); },
    requiresCurrentSave: isGroup && Boolean(current) && !activeCheckout,
    addCurrentItem: () => saveCurrentItem(false), confirmCurrentItem: () => saveCurrentItem(true),
    changeQuantity, removeItem, reloadCart, cancelCheckout, uiError: error || cart.error,
    paymentBlocked: cartPaymentBlocked(cart, { cartOnly, isCustom: order.embroidery.type === "custom" }) || saving || Boolean(draftItem) };
};
