import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PaymentFail() {
  const navigate = useNavigate();

  useEffect(() => {
    // если хранили orderId — можно вернуть пользователя на оформление
    const orderId = sessionStorage.getItem('pay_order_id');
    // через пару секунд вернём на страницу оформления/оплаты
    const t = setTimeout(() => {
      if (orderId) navigate('/recipient', { replace: true });
      else navigate('/', { replace: true });
    }, 2500);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div style={{ padding: 24 }}>
      Платёж не был завершён или отменён. Возвращаем вас обратно…
    </div>
  );
}
