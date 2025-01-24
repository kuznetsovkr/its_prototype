import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
    const navigate = useNavigate();
    const [trackingFormVisible, setTrackingFormVisible] = useState(false);
    const [orderNumber, setOrderNumber] = useState('');
    const [orderStatus, setOrderStatus] = useState('');

    const handleTrackOrder = () => {
        // Здесь вы можете сделать запрос к API для получения статуса заказа.
        // Пример ниже имитирует успешный ответ.
        if (orderNumber === '123456') {
            setOrderStatus('Заказ доставлен.');
        } else {
            setOrderStatus('Заказ не найден.');
        }
    };

    return (
        <div style={{ display: 'flex', padding: '20px', gap: '20px' }}>
            {/* Первая колонка */}
            <div style={{ flex: 1, borderRight: '1px solid #ccc', paddingRight: '20px' }}>
                <h1>Профиль</h1>
                <p><strong>Имя:</strong> Кирилл</p>
                <p><strong>Фамилия:</strong> Кузнецов</p>
                <p><strong>Дата рождения:</strong> 25.09.2001</p>
                <p><strong>Телефон:</strong> +7 996 429-25-50</p>
            </div>

            {/* Вторая колонка */}
            <div style={{ flex: 1, paddingLeft: '20px' }}>
                <h2>Навигация</h2>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ marginBottom: '10px' }}>
                        <button
                            onClick={() => navigate('/order-history')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#007bff',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                            }}
                        >
                            История заказов
                        </button>
                    </li>
                    <li style={{ marginBottom: '10px' }}>
                        <button
                            onClick={() => setTrackingFormVisible(!trackingFormVisible)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#007bff',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                            }}
                        >
                            Отследить заказ
                        </button>
                    </li>
                </ul>

                {/* Форма отслеживания заказа */}
                {trackingFormVisible && (
                    <div style={{ marginTop: '20px' }}>
                        <h3>Введите номер заказа</h3>
                        <input
                            type="text"
                            value={orderNumber}
                            onChange={(e) => setOrderNumber(e.target.value)}
                            placeholder="Номер заказа"
                            style={{ padding: '10px', width: '70%', marginBottom: '10px' }}
                        />
                        <button
                            onClick={handleTrackOrder}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#007bff',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            Отследить
                        </button>

                        {orderStatus && (
                            <p style={{ marginTop: '10px', fontWeight: 'bold' }}>
                                Статус заказа: {orderStatus}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
