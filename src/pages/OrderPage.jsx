import ClothingSelector from "../components/ClothingSelector";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";

const OrderPage = () => {
  const cart = useCart();
  const location = useLocation();
  return (
    <section className="orderPage" aria-labelledby="order-clothing-title">
      {cart.items.length > 0 && <div className="orderCartShortcut" role="status">
        <span>{location.state?.cartItemAdded ? "Изделие добавлено. Можно создать следующее." : "У вас есть сохранённые изделия."}</span>
        <Link to="/recipient?cart=1">Открыть корзину ({cart.items.reduce((sum, item) => sum + item.quantity, 0)})</Link>
      </div>}
      <div className="orderPage__stage">
        <div className="orderBlock orderBlock--clothing">
          <ClothingSelector />
        </div>
      </div>
    </section>
  );
};

export default OrderPage;
