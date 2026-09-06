import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';
import { getOrderAccessToken, orderAccessConfig } from '../utils/orderAccess';
import '../assets/styles/pages/_thx.scss';

const ThankYouPage = () => {
  const location = useLocation();
  const { orderNumber, manual, cdekNumber: stateCdekNumber } = location.state || {};
  const [cdekNumber, setCdekNumber] = useState(
    stateCdekNumber || sessionStorage.getItem("pay_cdek_number") || null
  );

  useEffect(() => {
    if (manual || cdekNumber || !orderNumber) return undefined;
    const orderToken = getOrderAccessToken(orderNumber);
    if (!orderToken) return undefined;

    let attempts = 0;
    let stopped = false;
    const loadShipmentNumber = async () => {
      attempts += 1;
      try {
        const { data } = await api.get(
          `/orders/${encodeURIComponent(orderNumber)}`,
          orderAccessConfig(orderNumber, orderToken)
        );
        if (data?.cdekNumber && !stopped) {
          const value = String(data.cdekNumber);
          sessionStorage.setItem("pay_cdek_number", value);
          setCdekNumber(value);
        }
      } catch {
        // Фоновое обновление номера не должно мешать странице благодарности.
      }
    };

    loadShipmentNumber();
    const timer = setInterval(() => {
      if (attempts >= 20 || stopped) {
        clearInterval(timer);
        return;
      }
      loadShipmentNumber();
    }, 3000);

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [cdekNumber, manual, orderNumber]);

  const copyTrack = async () => {
    if (!cdekNumber) return;
    try {
      await navigator.clipboard.writeText(cdekNumber);
      alert("Трек-номер скопирован");
    } catch {
      alert("Не удалось скопировать трек-номер");
    }
  };

  return (
    <main className="thx" role="main">
      <section className="thx__card" aria-labelledby="thx-title">
        <div className="thx__icon" aria-hidden="true">
          <svg className="thx__icon-svg" viewBox="0 0 24 24">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M16.5 8.5l-5.5 7-3-3" />
          </svg>
        </div>

        <h1 id="thx-title" className="thx__title">Спасибо за заказ!</h1>

        <p className="thx__text">
          {manual
            ? 'Мы приняли ваш заказ. Менеджер свяжется с вами для уточнения деталей и расчёта стоимости.'
            : 'Мы приняли ваш заказ.'}
        </p>

        {orderNumber ? (
          <p className="thx__order">
            <span className="thx__order-label">Номер заказа:</span>
            <span className="thx__order-number">{orderNumber}</span>
          </p>
        ) : (
          <p className="thx__hint">Номер заказа отсутствует — обратитесь в поддержку.</p>
        )}

        {cdekNumber && (
          <p className="thx__order" style={{ cursor: 'pointer' }} onClick={copyTrack}>
            <span className="thx__order-label">Трек-номер СДЭК:</span>
            <span className="thx__order-number">{cdekNumber}</span>
          </p>
        )}

      </section>
    </main>
  );
};

export default ThankYouPage;
