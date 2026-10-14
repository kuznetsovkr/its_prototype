import ReactDOM from "react-dom/client";
import App from "./App";
import "./assets/styles/main.scss";
import "lenis/dist/lenis.css";
import { OrderProvider } from "./context/OrderContext";
import { CartProvider } from "./context/CartContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <CartProvider>
    <OrderProvider>
      <App />
    </OrderProvider>
  </CartProvider>
);
