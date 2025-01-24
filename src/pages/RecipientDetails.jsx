import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const RecipientDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { selectedType, customText, uploadedImage, comment } = location.state || {};

    const [pickupPoints, setPickupPoints] = useState([]);
    const [selectedPoint, setSelectedPoint] = useState('');
    const [noCdekInCity, setNoCdekInCity] = useState(false);
    const [deliveryPrice, setDeliveryPrice] = useState(0);
    const [embroideryPrice, setEmbroideryPrice] = useState(1000); // Примерная цена вышивки
    const [agreementChecked, setAgreementChecked] = useState(false);

    useEffect(() => {
        // Запрос к API СДЭК для получения пунктов выдачи
        async function fetchPickupPoints() {
            try {
                const response = await fetch('https://api.cdek.ru/pickup_points', {
                    method: 'GET',
                });
                const data = await response.json();
                setPickupPoints(data.points);
            } catch (error) {
                console.error('Ошибка при загрузке пунктов выдачи:', error);
            }
        }

        if (!noCdekInCity) {
            fetchPickupPoints();
        }
    }, [noCdekInCity]);

    const totalPrice = embroideryPrice + (noCdekInCity ? 0 : deliveryPrice);

    const handlePayment = () => {
        // Генерация номера заказа
        const orderNumber = Math.floor(100000 + Math.random() * 900000); // Пример случайного номера
        navigate('/thank-you', {
            state: { orderNumber, selectedType, customText, uploadedImage, comment },
        });
    };

    return (
        <div style={{ display: 'flex', padding: '20px' }}>
            {/* Левая часть экрана */}
            <div style={{ flex: 1 }}>
                <h1>Данные о получателе</h1>
                <p><strong>Тип вышивки:</strong> {selectedType}</p>
                {selectedType === 'custom' && <p><strong>Текст для вышивки:</strong> {customText}</p>}
                {uploadedImage && <p><strong>Изображение:</strong> {uploadedImage.name}</p>}
                <p><strong>Комментарий:</strong> {comment}</p>

                <div>
                    <h2>Выбор пункта выдачи</h2>
                    <label>
                        <input
                            type="checkbox"
                            checked={noCdekInCity}
                            onChange={(e) => setNoCdekInCity(e.target.checked)}
                        />
                        В моем городе нет СДЭКа
                    </label>
                    {!noCdekInCity && (
                        <select
                            value={selectedPoint}
                            onChange={(e) => setSelectedPoint(e.target.value)}
                            style={{ width: '100%', margin: '10px 0' }}
                        >
                            <option value="">Выберите пункт выдачи</option>
                            {pickupPoints.map((point) => (
                                <option key={point.id} value={point.id}>
                                    {point.name} ({point.address})
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Правая колонка */}
            <div style={{ flex: 0.5, marginLeft: '20px' }}>
                <h2>Цена</h2>
                <p>Стоимость вышивки: {embroideryPrice} руб.</p>
                <p>Стоимость доставки: {noCdekInCity ? '0' : deliveryPrice} руб.</p>
                <p><strong>Итого:</strong> {totalPrice} руб.</p>

                <div style={{ marginTop: '20px' }}>
                    <label>
                        <input
                            type="checkbox"
                            checked={agreementChecked}
                            onChange={(e) => setAgreementChecked(e.target.checked)}
                        />
                        Я согласен с пользовательским соглашением
                    </label>
                </div>

                <button
                    onClick={handlePayment}
                    disabled={!agreementChecked}
                    style={{
                        marginTop: '20px',
                        padding: '10px 20px',
                        backgroundColor: agreementChecked ? '#007bff' : '#ccc',
                        color: '#fff',
                        border: 'none',
                        cursor: agreementChecked ? 'pointer' : 'not-allowed',
                    }}
                >
                    Перейти к оплате
                </button>
            </div>
        </div>
    );
};

export default RecipientDetails;
