import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api';
import { getOrderAccessToken, orderAccessConfig } from '../utils/orderAccess';
import thankYouDog from '../images/home/desktop/questions-dog-on.webp';
import '../assets/styles/pages/_thx.scss';

const ThankYouPage = () => {
  const location = useLocation();
  const { orderNumber, manual, cdekNumber: stateCdekNumber } = location.state || {};
  const [cdekNumber, setCdekNumber] = useState(
    stateCdekNumber || sessionStorage.getItem("pay_cdek_number") || null
  );
  const [copyState, setCopyState] = useState('idle');

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

  useEffect(() => {
    if (copyState === 'idle') return undefined;
    const timer = setTimeout(() => setCopyState('idle'), 2500);
    return () => clearTimeout(timer);
  }, [copyState]);

  const copyTrack = async () => {
    if (!cdekNumber) return;
    try {
      await navigator.clipboard.writeText(cdekNumber);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  };

  const copyLabel = copyState === 'copied'
    ? 'Скопировано'
    : copyState === 'error'
      ? 'Не удалось скопировать'
      : 'Скопировать';

  return (
    <div className="thx">
      <section className="thx__card" aria-labelledby="thx-title">
        <div className="thx__visual" aria-hidden="true">
          <span className="thx__spark thx__spark--one">✦</span>
          <span className="thx__spark thx__spark--two">✦</span>
          <span className="thx__spark thx__spark--three">✦</span>
          <div className="thx__seal">
            <span>заказ</span>
            <strong>принят</strong>
          </div>
          <img className="thx__dog" src={thankYouDog} alt="" />
        </div>

        <div className="thx__content">
          <div className="thx__heading">
            <p className="thx__eyebrow">
              <span className="thx__check" aria-hidden="true">
                <svg viewBox="0 0 16 16">
                  <path d="m3.5 8.2 2.7 2.7 6.3-6.1" />
                </svg>
              </span>
              заказ успешно оформлен
            </p>
            <h1 id="thx-title" className="thx__title">
              Спасибо!<br />Всё получилось.
            </h1>
            <p className="thx__text">
              {manual
                ? 'Заявка уже у нас. Менеджер свяжется с вами для уточнения деталей и расчёта стоимости.'
                : 'Мы приняли ваш заказ и уже передали его в работу.'}
            </p>
          </div>

          <div className="thx__details" aria-label="Детали заказа">
            <div className="thx__details-heading">
              <h2>Детали заказа</h2>
              <span>{manual ? 'ручной расчёт' : 'заказ оплачен'}</span>
            </div>

            {orderNumber ? (
              <div className="thx__order-row">
                <span className="thx__order-label">Номер заказа</span>
                <strong className="thx__order-number">{orderNumber}</strong>
              </div>
            ) : (
              <p className="thx__hint">Номер заказа не найден. Пожалуйста, обратитесь к нам — мы поможем.</p>
            )}

            {!manual && orderNumber && (
              cdekNumber ? (
                <button
                  type="button"
                  className={`thx__order-row thx__order-row--copy${copyState === 'error' ? ' is-error' : ''}`}
                  onClick={copyTrack}
                  aria-label={`Трек-номер СДЭК ${cdekNumber}. ${copyLabel}`}
                >
                  <span className="thx__order-label">Трек-номер СДЭК</span>
                  <span className="thx__track">
                    <strong className="thx__order-number">{cdekNumber}</strong>
                    <span className="thx__copy-status" aria-live="polite">{copyLabel}</span>
                  </span>
                </button>
              ) : (
                <div className="thx__order-row">
                  <span className="thx__order-label">Трек-номер СДЭК</span>
                  <span className="thx__pending"><i aria-hidden="true" />готовим отправление</span>
                </div>
              )
            )}
          </div>

          <div className="thx__next">
            <span>что дальше</span>
            <p>
              {manual
                ? 'Проверим детали заказа, рассчитаем итоговую стоимость и напишем удобным для вас способом.'
                : 'Подготовим заказ к производству и сообщим, когда он будет готов к отправке.'}
            </p>
          </div>

          <Link className="thx__home-link" to="/">
            <span>на главную</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ThankYouPage;
