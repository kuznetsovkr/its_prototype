import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const ThankYouPage = () => {
    const location = useLocation();
    const { orderNumber } = location.state || {};

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>Спасибо за заказ!</h1>
            <p>Данные вашего заказа:</p>
            <p><strong>Номер заказа:</strong> {orderNumber}</p>
            <Link to="/profile" style={{ color: '#007bff', textDecoration: 'none' }}>
                Отследить в личном кабинете
            </Link>
        </div>
    );
};

export default ThankYouPage;
