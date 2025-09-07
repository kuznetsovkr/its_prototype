import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState('Оплата успешно завершена. Подтверждаем заказ…');

  useEffect(() => {
    const orderId = sessionStorage.getItem('pay_order_id');
    if (!orderId) {
      setMsg('Не найден номер заказа. Вернёмся на главную.');
      const t = setTimeout(() => navigate('/'), 2000);
      return () => clearTimeout(t);
    }

    let tries = 0;
    const timer = setInterval(async () => {
      tries++;
      try {
        const { data } = await api.get(`/orders/${orderId}`);
        if (data.paymentStatus === 'paid') {
          navigate('/thank-you', { state: { orderNumber: orderId } });
        } else if (tries % 5 === 0) {
          setMsg('Оплата зафиксирована на стороне банка. Проверяем подтверждение…');
        }
      } catch (e) {
        // тихо ретраим
      }
      // на всякий случай остановим ожидание через ~30 сек
      if (tries > 20) {
        setMsg('Долго не получаем подтверждение. Попробуйте обновить страницу или зайдите в профиль.');
      }
    }, 1500);

    return () => clearInterval(timer);
  }, [navigate]);

  return <div style={{ padding: 24 }}>{msg}</div>;
}
