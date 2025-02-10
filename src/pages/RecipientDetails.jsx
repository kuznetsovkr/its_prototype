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

    // Получение токена API CDEK
    const getCdekToken = async () => {
        const clientId = 'your_client_id'; // Укажи свой client_id
        const clientSecret = 'your_client_secret'; // Укажи свой client_secret

        try {
            const response = await fetch('https://api.edu.cdek.ru/v2/oauth/token?grant_type=client_credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: clientId,
                    client_secret: clientSecret,
                }),
            });

            const data = await response.json();
            return data.access_token;
        } catch (error) {
            console.error('Ошибка при получении токена:', error);
            return null;
        }
    };

    // Функция расчета стоимости доставки
    const calculateDelivery = async (cityTo) => {
        const token = await getCdekToken();
        if (!token) return;

        const requestBody = {
            "from_location": { "code": 270 }, // Код города отправки (пример: Москва)
            "to_location": { "code": cityTo }, // Код города получателя
            "packages": [{ "weight": 500, "length": 10, "width": 10, "height": 10 }]
        };

        try {
            const response = await fetch('https://api.edu.cdek.ru/v2/calculator/tarifflist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();
            if (data.errors) {
                console.error('Ошибка расчёта:', data.errors);
                return;
            }

            // Выбираем минимальную стоимость доставки
            const minPrice = data.tariff_codes?.reduce((min, tariff) => 
                tariff.delivery_sum < min ? tariff.delivery_sum : min, Infinity
            );

            setDeliveryPrice(minPrice || 0);
        } catch (error) {
            console.error('Ошибка при расчёте доставки:', error);
        }
    };

    // Получение пунктов выдачи CDEK
    useEffect(() => {
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

    // Пересчет стоимости доставки при выборе пункта
    useEffect(() => {
        if (selectedPoint) {
            const cityTo = 270; // Код города получения (замени на актуальный)
            calculateDelivery(cityTo);
        }
    }, [selectedPoint]);

    const totalPrice = embroideryPrice + (noCdekInCity ? 0 : deliveryPrice);

    const handlePayment = () => {
        const orderNumber = Math.floor(100000 + Math.random() * 900000); // Генерация номера заказа
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
