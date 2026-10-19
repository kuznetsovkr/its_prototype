import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useOrder } from "../context/OrderContext";
import OrderCompletionPanel from "../features/order/completion/OrderCompletionPanel";
import { getOrderCompletionContent } from "../features/order/completion/orderCompletionContent";
import "../assets/styles/pages/_thx.scss";

const ThankYouPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetOrder } = useOrder();
  const { orderNumber, manual, requestKind, receiptEmailProvided, cdekNumber, deliveryPayLater } = location.state || {};
  const titleRef = useRef(null);
  const [copyState, setCopyState] = useState("idle");
  const content = getOrderCompletionContent({ manual, requestKind, receiptEmailProvided, deliveryPayLater });

  useEffect(() => {
    if (!orderNumber) {
      navigate("/order", { replace: true });
      return;
    }
    resetOrder();
    titleRef.current?.focus({ preventScroll: true });
  }, [navigate, orderNumber, resetOrder]);

  useEffect(() => {
    if (copyState === "idle") return undefined;
    const timer = setTimeout(() => setCopyState("idle"), 2500);
    return () => clearTimeout(timer);
  }, [copyState]);

  const copyTrack = async () => {
    if (!cdekNumber) return;
    try {
      await navigator.clipboard.writeText(cdekNumber);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };
  const copyLabel = copyState === "copied" ? "Скопировано"
    : copyState === "error" ? "Не удалось скопировать" : "Скопировать";

  if (!orderNumber) return <div className="route-loading" role="status">Переходим к оформлению заказа…</div>;

  return (
    <section className={`thx${manual ? " thx--manual" : ""}`} aria-labelledby="thx-title">
      <div className="thx__stage">
        <div className="thx__card">
          <OrderCompletionPanel content={content} titleRef={titleRef} />
          <div className="thx__meta" aria-label="Детали заказа">
            <p>{manual ? "Номер заявки" : "Номер заказа"}: <strong className="thx__order-number">{orderNumber}</strong></p>
            {!manual && cdekNumber && (
              <button type="button" className="thx__tracking" onClick={copyTrack} aria-label={`Трек-номер СДЭК ${cdekNumber}. ${copyLabel}`}>
                Трек-номер СДЭК: <strong>{cdekNumber}</strong> <span aria-live="polite">{copyLabel}</span>
              </button>
            )}
            <Link className="thx__home-link" to="/">на главную</Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ThankYouPage;
