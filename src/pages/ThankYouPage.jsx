import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import '../assets/styles/pages/_thx.scss';

const ThankYouPage = () => {
  const location = useLocation();
  const { orderNumber, manual } = location.state || {};

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
            : 'Мы приняли ваш заказ. Номер заказа:'}
        </p>

        {orderNumber ? (
          <p className="thx__order">
            <span className="thx__order-label">Номер заказа:</span>
            <span className="thx__order-number">{orderNumber}</span>
          </p>
        ) : (
          <p className="thx__hint">Номер заказа отсутствует — обратитесь в поддержку.</p>
        )}


      </section>
    </main>
  );
};

export default ThankYouPage;
