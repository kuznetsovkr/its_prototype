import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import {
  clearOrderAccessToken,
  getOrderAccessToken,
  orderAccessConfig,
} from '../utils/orderAccess';
import s from './PaymentFail.module.scss';

export default function PaymentFail() {
  const navigate = useNavigate();
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState('');
  const orderId = sessionStorage.getItem('pay_order_id');
  const orderToken = getOrderAccessToken(orderId);

  useEffect(() => {
    if (!orderId || !orderToken) {
      setError('Не удалось найти сохранённый заказ. Начните оформление заново.');
      return;
    }

    api.get(`/orders/${encodeURIComponent(orderId)}`, orderAccessConfig(orderId, orderToken))
      .then(({ data }) => {
        if (data?.paymentStatus === 'paid') {
          navigate('/payment-success', { replace: true });
        }
      })
      .catch(() => {
        setError('Не удалось проверить заказ. Вы можете повторить попытку оплаты.');
      });
  }, [navigate, orderId, orderToken]);

  const retryPayment = async () => {
    if (!orderId || !orderToken || isRetrying) return;
    setError('');
    setIsRetrying(true);
    try {
      const { data } = await api.post(
        '/payments/paykeeper/link',
        { orderId: Number(orderId) },
        orderAccessConfig(orderId, orderToken)
      );
      if (!data?.pay_url) throw new Error('Платёжная ссылка не получена');
      window.location.assign(data.pay_url);
    } catch (paymentError) {
      setError(paymentError.message || 'Не удалось повторить оплату');
      setIsRetrying(false);
    }
  };

  const startNewOrder = () => {
    clearOrderAccessToken(orderId);
    sessionStorage.removeItem('pay_order_id');
    sessionStorage.removeItem('pay_cdek_number');
    navigate('/order', { replace: true });
  };

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

        </div>

        <p className={s.message}>
          Платёж не был завершён или был отменён. Заказ сохранён, и оплату можно повторить.
        </p>
        {error && <p className={s.error} role="alert">{error}</p>}
        <div className={s.actions}>
          <button type="button" onClick={retryPayment} disabled={!orderId || !orderToken || isRetrying}>
            {isRetrying ? 'Открываем оплату…' : 'Повторить оплату'}
          </button>
          <button type="button" className={s.secondary} onClick={startNewOrder}>
            Оформить заново
          </button>
        </div>
      </div>
    </div>
  );
}
