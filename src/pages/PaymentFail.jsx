// src/pages/PaymentFail.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import s from './PaymentFail.module.scss';

export default function PaymentFail() {
  const navigate = useNavigate();

  useEffect(() => {
    const orderId = sessionStorage.getItem('pay_order_id');
    const t = setTimeout(() => {
      if (orderId) navigate('/recipient', { replace: true });
      else navigate('/', { replace: true });
    }, 5000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className={s.wrap}>
      <div className={s.card}>
        <div className={s.mediaBox} aria-label="Платёж не завершён">
          <video
            className={s.media}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
          >
            {/* Положи файлы в public/media/payment/ */}
            <source src="/media/payment/fail_generic.webm" type="video/webm" />
            {/* необязательно, но полезно для iOS/Safari */}
            <source src="/media/payment/fail_generic.mp4" type="video/mp4" />
          </video>

          {/* Фолбэк, если видео не воспроизведётся */}
          <img
            className={s.mediaFallback}
            src="/media/payment/fail_generic.gif"
            alt="Платёж не завершён"
            loading="lazy"
          />
        </div>

        <p className={s.message}>
          Платёж не был завершён или отменён. Возвращаем вас обратно…
        </p>
      </div>
    </div>
  );
}
