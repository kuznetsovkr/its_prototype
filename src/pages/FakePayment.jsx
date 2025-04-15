import React from "react";

const FakePayment = () => {
    const handleSuccess = () => {
        window.opener.postMessage("payment_success", "*");
        window.close();
    };

    return (
        <div style={{ padding: "2rem", textAlign: "center" }}>
            <h2>Оплата вышивки</h2>
            <p>Тестовая страница. Нажмите кнопку, чтобы завершить оплату.</p>
            <button onClick={handleSuccess} style={{ padding: "10px 20px", marginTop: "20px" }}>
                Оплачено
            </button>
        </div>
    );
};

export default FakePayment;
