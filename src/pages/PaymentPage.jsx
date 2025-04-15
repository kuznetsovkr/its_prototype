import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const PaymentPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { userData, selectedProduct } = location.state || {};
    
    console.log ("юзер");
    console.log (userData);

    const formData = new FormData();

    formData.append("firstName", userData.firstName);
    formData.append("lastName", userData.lastName);
    formData.append("middleName", userData.middleName);
    formData.append("phone", userData.phone);
    formData.append("productType", selectedProduct.productType);
    formData.append("color", selectedProduct.color);
    formData.append("size", selectedProduct.size);
    formData.append("embroideryType", selectedProduct.embroideryType);
    formData.append("customText", selectedProduct.customText || "");
    formData.append("comment", selectedProduct.comment || "");
    formData.append("deliveryAddress", location.state.deliveryAddress || "Не указан");
    formData.append("totalPrice", location.state.totalPrice || "Неопределенна");

    // Добавим изображения (до 10)
    selectedProduct.uploadedImage?.forEach((file, index) => {
    formData.append("images", file, `image_${index}.jpg`);
    });


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
                      Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: formData,
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
}, []); 



    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <h1>🔄 Оплата...</h1>
            <p>Пожалуйста, подождите, пока ваш платёж обрабатывается.</p>
        </div>
    );
};

export default PaymentPage;
