import React, { useEffect } from "react";

const PaymentPage = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        // Сообщаем родителю об успешной оплате
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(
            { type: "payment_status", status: "success" },
            window.location.origin
          );
        }
      } finally {
        // Закрываем фейковое окно оплаты
        window.close();
      }
    }, 2000); // 2 сек "обработки"

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ textAlign: "center", padding: 20 }}>
      <h1>🔄 Оплата...</h1>
      <p>Пожалуйста, подождите, пока ваш платёж обрабатывается.</p>
    </div>
  );
};

export default PaymentPage;
