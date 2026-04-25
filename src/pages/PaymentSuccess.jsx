import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import s from './PaymentSuccess.module.scss';

const STATUS_MEDIA = {
  confirming: {
    webm: '/media/payment/confirming.webm',
    mp4: '/media/payment/confirming.mp4',
    gif: '/media/payment/confirming.gif',
    alt: 'Подтверждаем оплату…',
  },
  bankPending: {
    webm: '/media/payment/bank_pending.webm',
    mp4: '/media/payment/bank_pending.mp4',
    gif: '/media/payment/bank_pending.gif',
    alt: 'Оплата зафиксирована банком, ждём подтверждение…',
  },
  timeout: {
    webm: '/media/payment/timeout.webm',
    mp4: '/media/payment/timeout.mp4',
    gif: '/media/payment/timeout.gif',
    alt: 'Долго не получаем подтверждение…',
  },
  missing: {
    webm: '/media/payment/missing.webm',
    mp4: '/media/payment/missing.mp4',
    gif: '/media/payment/missing.gif',
    alt: 'Не найден номер заказа',
  },
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
    if (!orderId) {
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
        const { data } = await api.get(`/orders/${orderId}`);
        if (data.paymentStatus === 'paid') {
          if (data.status !== 'Оплачено') {
            try {
              await api.post(`/orders/confirm/${orderId}`, { provider: 'fallback' });
            } catch {
              // do nothing; retry on next tick
            }
            return;
          }

          finalizedRef.current = true;
          navigate('/thank-you', { state: { orderNumber: orderId } });
          return;
        }

        if (!finalizedRef.current && tries % 5 === 0) {
          setStatus('bankPending');
          setMsg('Оплата зафиксирована на стороне банка. Проверяем подтверждение…');
        }

        if (!finalizedRef.current && tries > 20) {
          finalizedRef.current = true;
          setStatus('timeout');
          setMsg('Долго не получаем подтверждение. Попробуйте обновить страницу или зайдите в профиль.');
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
          <video
            key={status}
            className={s.media}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
          >
            {media?.webm && <source src={media.webm} type="video/webm" />}
            {media?.mp4 && <source src={media.mp4} type="video/mp4" />}
          </video>

          {media?.gif && (
            <img
              className={s.mediaFallback}
              src={media.gif}
              alt={media.alt || 'Статус оплаты'}
              loading="lazy"
            />
          )}
        </div>

        <p className={s.message} aria-live="polite">{msg}</p>
      </div>
    </div>
  );
}
