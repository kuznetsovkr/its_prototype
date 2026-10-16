import { useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { CartProvider } from "../../src/context/CartContext";
import { OrderProvider, useOrder } from "../../src/context/OrderContext";
import Header from "../../src/components/Header";
import RecipientDetails from "../../src/pages/RecipientDetails";
import OrderPage from "../../src/pages/OrderPage";
import PaymentSuccess from "../../src/pages/PaymentSuccess";
import ThankYouPage from "../../src/pages/ThankYouPage";
import EmbroideryPage from "../../src/pages/EmbroideryPage";
import { storeOrderAccessToken } from "../../src/utils/orderAccess";
import "../../src/assets/styles/main.scss";

const Harness = () => {
  const { order, setClothing, setEmbroidery, setRecipient, missingUploadFiles } = useOrder();
  const [file, setFile] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const seed = () => {
    setClothing({ type: "Худи", color: "Чёрный", size: "M", previewSrc: "/e2e/catalog-hoodie.png", previewAlt: "Худи",
      profile: { name: "Худи", code: "hoodie", patronusLimit: 4, package: { weight: 800 } } });
    setEmbroidery({ type: "Patronus", typeSelectionExplicit: true, patronusCount: 4, petFaceCount: 1, uploadedImage: [file], comment: "Четыре питомца" });
    navigate("/recipient");
  };
  return <>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 8 }}>
      <input aria-label="Фото для теста" type="file" onChange={(event) => setFile(event.target.files[0])} />
      <button disabled={!file} onClick={seed}>Подготовить худи</button>
      <button disabled={!file} onClick={() => {
        setEmbroidery({ type: "Car", typeSelectionExplicit: true, uploadedImage: [file], comment: "Вид спереди" });
        navigate("/embroidery");
      }}>Добавить фото в черновик</button>
      <button onClick={() => navigate("/recipient?cart=1")}>Открыть сохранённую корзину</button>
      <button onClick={() => navigate("/payment-success")}>Вернуться с оплаты</button>
      <button onClick={() => {
        storeOrderAccessToken(99, "old-standalone-order");
        setRecipient({ savedOrder: { orderId: 99, orderToken: "old-standalone-order", isCartOrder: false } });
        navigate("/order");
      }}>Подставить прежний одиночный заказ</button>
    </div>
    <output hidden data-testid="draft-state">{JSON.stringify({ path: location.pathname, cartItemKey: order.cartItemKey,
      clothing: order.clothing, embroidery: order.embroidery, missingUploadFiles, embroideryType: order.embroidery.type,
      files: order.embroidery.uploadedImage.map((entry) => entry.name), recipient: order.recipient })}</output>
    <Header />
    <Routes>
      <Route path="/recipient" element={<RecipientDetails />} />
      <Route path="/order" element={<OrderPage />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/thank-you" element={<ThankYouPage />} />
      <Route path="/embroidery" element={<EmbroideryPage />} />
    </Routes>
  </>;
};

createRoot(document.getElementById("root")).render(
  <CartProvider><OrderProvider><MemoryRouter initialEntries={[new URLSearchParams(window.location.search).has("order") ? "/order" : new URLSearchParams(window.location.search).has("resume") ? "/recipient" : "/recipient?cart=1"]}><Harness /></MemoryRouter></OrderProvider></CartProvider>
);
