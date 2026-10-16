import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useOrder } from "../../context/OrderContext";
import OrderModal from "../order/shared/OrderModal";
import RecipientCartList from "./RecipientCartList";
import { confirmDiscardConstructor } from "./ConstructorDraftNotice";
import { getCartDraftItem } from "./cartPresentation";

const CartDrawer = ({ onClose, returnFocusTo }) => {
  const cart = useCart();
  const { order, resetCurrentItem, constructorDraftError } = useOrder();
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const draftItem = getCartDraftItem(cart, order);
  const { reloadCart } = cart;
  useEffect(() => { reloadCart().catch(() => undefined); }, [reloadCart]);
  const change = async (operation) => {
    if (cart.pending || cart.checkout) return;
    setError("");
    try { await operation(); } catch (failure) { setError(failure.message); }
  };
  const preview = { ...cart, busy: cart.pending, draftItem, constructorDraftError, uiError: error || cart.error,
    changeQuantity: (id, quantity) => change(() => cart.setQuantity(id, quantity)),
    removeItem: (id) => change(() => cart.removeItem(id)),
    discardDraft: () => { if (confirmDiscardConstructor(order)) resetCurrentItem(); } };
  const canCheckout = cart.initialized && !cart.pending && (!cart.error || cart.checkout) && cart.items.length > 0 && !draftItem;
  return (
    <OrderModal className="cartDrawer" overlayClassName="cartDrawerOverlay" inertBackground
      labelledBy="cart-drawer-title" closeLabel="Закрыть корзину" onClose={onClose} returnFocusTo={returnFocusTo}>
      <h1 id="cart-drawer-title">Ваш заказ</h1>
      <div className="cartDrawer__body" data-lenis-prevent>
        <RecipientCartList cart={preview} variant="drawer" />
        <button className="cartDrawer__checkout" type="button" disabled={!canCheckout}
          title={draftItem ? "Завершите или удалите незавершённое изделие перед оформлением" : undefined}
          onClick={() => { onClose(); navigate("/recipient?cart=1"); }}>Оформить заказ</button>
        {cart.initialized && !cart.items.length && !draftItem && <Link className="cartDrawer__create" to="/order" onClick={onClose}>Выбрать изделие</Link>}
      </div>
    </OrderModal>
  );
};
export default CartDrawer;
