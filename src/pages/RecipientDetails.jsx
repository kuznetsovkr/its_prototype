import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MyCdekWidget from "../components/MyCdekWidget";

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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePayment = () => {

            console.log("📤 Передаём данные на страницу оплаты:", {
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
    });
        navigate("/payment", {
            state: {
                userData, // ✅ Передаём данные о получателе
                selectedProduct: {
                    productType,
                    color,
                    size,
                    embroideryType: selectedType,
                    customText,
                    uploadedImage,
                    comment,
                },
            },
        });
    };


    return (
        <div style={{ display: "flex", padding: "20px" }}>
            <div style={{ flex: 1 }}>
                <h1>Данные о получателе</h1>
                <label>Фамилия:</label>
                <input type="text" name="lastName" value={userData.lastName} onChange={handleInputChange} disabled={isUserAuthenticated} />

                <label>Имя:</label>
                <input type="text" name="firstName" value={userData.firstName} onChange={handleInputChange} disabled={isUserAuthenticated} />

                <label>Отчество:</label>
                <input type="text" name="middleName" value={userData.middleName} onChange={handleInputChange} disabled={isUserAuthenticated} />

                <label>Телефон:</label>
                <input type="tel" name="phone" value={userData.phone} onChange={handleInputChange} disabled={isUserAuthenticated} />

                <div id="cdek-map" style={{ width: "800px", height:"600px" }}>
                    <h2>Выбор пункта выдачи (СДЭК)</h2>
                    <MyCdekWidget />
                </div>

                <button onClick={handlePayment}>Перейти к оплате</button>
            </div>
        </div>
    );
};

export default RecipientDetails;
