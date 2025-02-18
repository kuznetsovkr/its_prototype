import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const PaymentPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { userData, selectedProduct } = location.state || {};
    
    console.log ("юзер");
    console.log (userData);

useEffect(() => {
    let isMounted = true; // Флаг для предотвращения дублирования

    const processPayment = async () => {
        if (!isMounted) return; // Если компонент размонтирован — не выполняем код

        console.log("🛒 Имитация оплаты...");
        
            console.log("📤 Отправляем заказ на сервер с данными:", {
            firstName: userData?.firstName || "",
            lastName: userData?.lastName || "",
            middleName: userData?.middleName || "",
            phone: userData?.phone || "",
            productType: selectedProduct.productType,
            color: selectedProduct.color,
            size: selectedProduct.size,
            embroideryType: selectedProduct.embroideryType,
            customText: selectedProduct.customText,
            uploadedImage: selectedProduct.uploadedImage,
            comment: selectedProduct.comment,
        });

        setTimeout(async () => {
            if (!isMounted) return; // Вторичная проверка

            console.log("✅ Оплата прошла успешно!");

            try {
                const response = await fetch("http://localhost:5000/api/orders/create", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify({
                        firstName: userData?.firstName || "",
                        lastName: userData?.lastName || "",
                        middleName: userData?.middleName || "",
                        phone: userData?.phone || "",
                        productType: selectedProduct.productType,
                        color: selectedProduct.color,
                        size: selectedProduct.size,
                        embroideryType: selectedProduct.embroideryType,
                        customText: selectedProduct.customText,
                        uploadedImage: selectedProduct.uploadedImage,
                        comment: selectedProduct.comment,
                    }),
                });

                const data = await response.json();
                if (response.ok) {
                    console.log("✅ Заказ успешно отправлен в Telegram!");
                    navigate("/thank-you", { state: { orderNumber: data.orderId } });
                } else {
                    console.error("❌ Ошибка при создании заказа:", data.message);
                }
            } catch (error) {
                console.error("❌ Ошибка при оформлении заказа:", error);
            }
        }, 3000);
    };

    processPayment();

    return () => {
        isMounted = false; // Перед выходом из компонента отключаем повторный вызов
    };
}, []);  // ✅ Убрали `navigate, location.state`, теперь сработает только 1 раз



    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <h1>🔄 Оплата...</h1>
            <p>Пожалуйста, подождите, пока ваш платёж обрабатывается.</p>
        </div>
    );
};

export default PaymentPage;
