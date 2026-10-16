import ClothingSelector from "../components/ClothingSelector";
import { useCart } from "../context/CartContext";
import { useOrder } from "../context/OrderContext";
import { useEffect } from "react";
import ConstructorDraftNotice from "../features/cart/ConstructorDraftNotice";

const OrderPage = () => {
  const cart = useCart();
  const { order, resetCurrentItem, constructorResetCount } = useOrder();
  const alreadySaved = cart.initialized && cart.items.some((item) => item.requestKey === order.cartItemKey);
  useEffect(() => {
    // Reconcile an accepted upload even after sessionStorage was lost. Keep its
    // server copy, never create a second unfinished copy on browser restart.
    if (alreadySaved) resetCurrentItem();
  }, [alreadySaved, resetCurrentItem]);
  return (
    <section className="orderPage" aria-labelledby="order-clothing-title">
      {!alreadySaved && <ConstructorDraftNotice />}
      <div className="orderPage__stage">
        <div className="orderBlock orderBlock--clothing">
          {alreadySaved ? <p role="status">Восстанавливаем сохранённое изделие…</p> : <ClothingSelector key={constructorResetCount} />}
        </div>
      </div>
    </section>
  );
};

export default OrderPage;
