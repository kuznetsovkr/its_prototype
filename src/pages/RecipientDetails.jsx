import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MyCdekWidget from "../components/MyCdekWidget";
import { AddressSuggestions } from 'react-dadata';

const RecipientDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { selectedType, customText, uploadedImage, comment, productType, color, size } = location.state || {};

    const [userData, setUserData] = useState({
        firstName: "",
        lastName: "",
        middleName: "",
        phone: "",
    });

    const [pickupPoint, setPickupPoint] = useState(""); // для address.name
    const [deliveryPrice, setDeliveryPrice] = useState(null); // для rate.delivery_sum
    const [manualAddress, setManualAddress] = useState(null);
    const mockEmbroideryPrice = 1200;

    const totalPrice = mockEmbroideryPrice + (deliveryPrice || 0);

    const [isUserAuthenticated, setIsUserAuthenticated] = useState(!!localStorage.getItem("token"));

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const response = await fetch("http://localhost:5000/api/user/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setUserData({
                        firstName: data.firstName || "",
                        lastName: data.lastName || "",
                        middleName: data.middleName || "",
                        phone: data.phone || "",
                    });
                }
            } catch (error) {
                console.error("Ошибка получения данных пользователя:", error);
            }
        };

        if (isUserAuthenticated) {
            fetchUserData();
        }
    }, [isUserAuthenticated]);

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data === "payment_success") {
                console.log("✅ Оплата прошла успешно!");
    
                // Переход на страницу подтверждения или следующий шаг
                navigate("/payment", {
                    state: {
                        userData,
                        selectedProduct: {
                            productType,
                            color,
                            size,
                            embroideryType: selectedType,
                            customText,
                            uploadedImage,
                            comment,
                        },
                        deliveryAddress: pickupPoint || manualAddress?.value,
                        totalPrice,
                    },
                });
            }
        };
    
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [navigate, userData, selectedType, customText, uploadedImage, comment, productType, color, size, pickupPoint, manualAddress, totalPrice]);
    

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePayment = () => {
        const paymentWindow = window.open("/fake-payment", "_blank", "width=500,height=600");
    
        // В будущем здесь будет запрос на PayKeeper и передача параметров
        console.log("📤 Отправка данных на оплату:", {
            embroideryPrice: mockEmbroideryPrice,
            deliveryPrice,
            total: totalPrice,
        });
    };
    

    const [isDifferentRecipient, setIsDifferentRecipient] = useState(false);


    const [isNoCdek, setIsNoCdek] = useState(false);
    const dadataToken = "0821b30c8abbf80ea31555ae120fed168b30b8dc"; // замени на свой токен

    // Проверка, все ли поля пользователя заполнены
    const isUserDataFilled = Object.values(userData).every((val) => val.trim() !== "");

    // Проверка, выбран ли СДЭК или введён адрес вручную
    const isDeliveryAddressFilled = !!pickupPoint || !!manualAddress?.value;

    // Общая проверка, можно ли нажимать кнопку
    const isFormValid = isUserDataFilled && isDeliveryAddressFilled;

    const [showValidationMessage, setShowValidationMessage] = useState(false);

    const handlePaymentClick = () => {
        if (!isFormValid) {
            setShowValidationMessage(true);
            setTimeout(() => {
                setShowValidationMessage(false);
            }, 3000);
            return;
        }
    
        handlePayment(); // если всё ок — переходим к оплате
    };

    const getMissingFieldsMessage = () => {
        const missing = [];
    
        if (!userData.lastName.trim()) missing.push("фамилию");
        if (!userData.firstName.trim()) missing.push("имя");
        if (!userData.middleName.trim()) missing.push("отчество");
        if (!userData.phone.trim()) missing.push("телефон");
        if (!pickupPoint && !manualAddress?.value) missing.push("адрес");
    
        if (missing.length === 0) return "";
    
        const last = missing.pop();
        const list = missing.length ? `${missing.join(", ")} и ${last}` : last;
    
        return `Пожалуйста, заполните ${list}`;
    };


    return (
        <div className="recipientDetails">
            <div className="recipientInfo">
                <p className="title">Данные о получателе</p>
                <div className="data">
                    <div className="element">
                        <label>Фамилия:</label>
                        <input type="text" name="lastName" value={userData.lastName} onChange={handleInputChange} disabled={isUserAuthenticated && !isDifferentRecipient} />
                    </div>
                    <div className="element">
                        <label>Имя:</label>
                        <input type="text" name="firstName" value={userData.firstName} onChange={handleInputChange} disabled={isUserAuthenticated && !isDifferentRecipient} />
                    </div>
                    <div className="element">
                        <label>Отчество:</label>
                        <input type="text" name="middleName" value={userData.middleName} onChange={handleInputChange} disabled={isUserAuthenticated && !isDifferentRecipient} />
                    </div>
                    <div className="element">
                        <label>Телефон:</label>
                        <input type="tel" name="phone" value={userData.phone} onChange={handleInputChange} disabled={isUserAuthenticated && !isDifferentRecipient} />
                    </div>
                </div>
                {isUserDataFilled && (
                    <div className="checkboxBlock">
                        <label>
                            <input
                                type="checkbox"
                                checked={isDifferentRecipient}
                                onChange={() => setIsDifferentRecipient((prev) => !prev)}
                            />
                            Получатель другой человек
                        </label>
                    </div>
                )}
            </div>

            <div className = "deliveryInfo">
                <div className="blockCDEK">
                    <p className="title">Выбор пункта выдачи (СДЭК)</p>
                    <div id="cdek-map">
                        <MyCdekWidget 
                            onAddressSelect={setPickupPoint}
                            onRateSelect={setDeliveryPrice}
                        />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                        <input
                            type="checkbox"
                            checked={isNoCdek}
                            onChange={() => setIsNoCdek(prev => !prev)}
                        />
                        В моём городе нет СДЭКа
                    </label>

                    {isNoCdek && (
                        <div style={{ marginTop: '12px', maxWidth: '400px' }}>
                            <p>Введите адрес вручную:</p>
                            <AddressSuggestions 
                                token={dadataToken}
                                placeholder="Начните вводить адрес..."
                                query={manualAddress?.value}
                                onChange={(suggestion) => setManualAddress(suggestion)}
                            />
                            {manualAddress && (
                                <p style={{ marginTop: '8px' }}>Вы выбрали: {manualAddress.value}</p>
                            )}
                        </div>
                    )}
 
                </div>
                <div className="deliveryCost">
                    <p className="title">Рассчёт стоимости</p> 
                    <div className="aboutPrice">
                        <p >Вышивка: </p> 
                        <p >Доставка:  {deliveryPrice !== null ? `${deliveryPrice} ₽` : "не рассчитана"}</p> 
                        <p className="summaryCost">Стоимость: </p> 
                    </div>
                    <div className="tooltip-container">
                        <button
                            onClick={handlePayment}
                            disabled={!isFormValid}
                            style={{
                                opacity: isFormValid ? 1 : 0.5,
                                cursor: isFormValid ? "pointer" : "not-allowed"
                            }}
                        >
                            Перейти к оплате
                        </button>
                        {!isFormValid && (
                            <div className="tooltip-text">
                                {getMissingFieldsMessage()}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecipientDetails;
