import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { getOrderAccessToken, orderAccessConfig } from '../utils/orderAccess';
import s from './PaymentSuccess.module.scss';

const STATUS_MEDIA = {
  confirming: {
    webm: '/media/payment/confirming.webm',
    mp4: '/media/payment/confirming.mp4',
    poster: '/media/payment/confirming-poster.webp',
    alt: 'Подтверждаем оплату…',
  },
  bankPending: {
    webm: '/media/payment/bank_pending.webm',
    mp4: '/media/payment/bank_pending.mp4',
    poster: '/media/payment/bank_pending-poster.webp',
    alt: 'Оплата зафиксирована банком, ждём подтверждение…',
  },
  timeout: {
    webm: '/media/payment/timeout.webm',
    mp4: '/media/payment/timeout.mp4',
    poster: '/media/payment/timeout-poster.webp',
    alt: 'Долго не получаем подтверждение…',
  },
  missing: {
    webm: '/media/payment/missing.webm',
    mp4: '/media/payment/missing.mp4',
    poster: '/media/payment/missing-poster.webp',
    alt: 'Не найден номер заказа',
  },
};

const PaymentStatusMedia = ({ media }) => {
  const [videoFailed, setVideoFailed] = useState(false);

  if (videoFailed) {
    return (
      <img
        className={s.media}
        src={media.poster}
        alt={media.alt || 'Статус оплаты'}
      />
    );
  }

  return (
    <video
      className={s.media}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      poster={media.poster}
      aria-hidden="true"
      onError={() => setVideoFailed(true)}
    >
      {media.webm && <source src={media.webm} type="video/webm" />}
      {media.mp4 && <source src={media.mp4} type="video/mp4" />}
    </video>
  );
};

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState('Оплата успешно завершена. Подтверждаем заказ…');
  const [status, setStatus] = useState('confirming');

  const finalizedRef = useRef(false);
  const inFlightRef = useRef(false);

  useEffect(() => {
    finalizedRef.current = false;
    inFlightRef.current = false;

    const orderId = sessionStorage.getItem('pay_order_id');
    const orderToken = getOrderAccessToken(orderId);
    if (!orderId || !orderToken) {
      setStatus('missing');
      setMsg('Не найден номер заказа. Вернёмся на главную.');
      const t = setTimeout(() => navigate('/'), 5000);
      return () => clearTimeout(t);
    }

    let tries = 0;

    const tick = async () => {
      if (finalizedRef.current || inFlightRef.current) return;
      inFlightRef.current = true;
      tries += 1;

      try {
        const { data } = await api.get(`/orders/${orderId}`, orderAccessConfig(orderId, orderToken));
        if (data.requiresReview || data.paymentStatus === 'review') {
          finalizedRef.current = true;
          setStatus('bankPending');
          setMsg('Оплата получена, но заказ требует проверки менеджером. Не оплачивайте его повторно. Свяжитесь с нами и сообщите номер заказа: ' + orderId);
          return;
        }
        if (data.paymentStatus === 'paid') {
          if (data.status !== 'Оплачено') {
            try {
              await api.post(
                `/orders/confirm/${orderId}`,
                { provider: 'fallback' },
                orderAccessConfig(orderId, orderToken)
              );
            } catch {
              // do nothing; retry on next tick
            }
            return;
          }

          finalizedRef.current = true;
          if (data.cdekNumber) {
            sessionStorage.setItem('pay_cdek_number', String(data.cdekNumber));
          } else {
            sessionStorage.removeItem('pay_cdek_number');
          }
          navigate('/thank-you', {
            state: { orderNumber: orderId, cdekNumber: data.cdekNumber || null },
          });
          return;
        }

        if (!finalizedRef.current && tries % 5 === 0) {
          setStatus('bankPending');
          setMsg('Оплата зафиксирована на стороне банка. Проверяем подтверждение…');
        }

        if (!finalizedRef.current && tries > 20) {
          finalizedRef.current = true;
          setStatus('timeout');
          setMsg('Долго не получаем подтверждение. Попробуйте обновить страницу немного позже.');
        }
      } catch {
        // silent retry
      } finally {
        inFlightRef.current = false;
      }
    };

    const timer = setInterval(tick, 1500);
    tick();

    return () => {
      finalizedRef.current = true;
      clearInterval(timer);
    };
  }, [navigate]);

  const media = STATUS_MEDIA[status];

  return (
    <div className={s.wrap}>
      <div className={s.card}>
        <div className={s.mediaBox} aria-label={media?.alt}>
          <PaymentStatusMedia key={status} media={media} />
        </div>

        <p className={s.message} aria-live="polite">{msg}</p>
      </div>
    </div>
  );
}
