import React, { useState, useEffect } from "react";
import api from './api'
import { applyAuthResponse } from "./utils/auth";

const AuthModal = ({ isAuthModalOpen, toggleAuthModal, onLoginSuccess }) => {
    const [phone, setPhone] = useState("+7 "); // Начинаем с +7
    const [smsCode, setSmsCode] = useState("");
    const [password, setPassword] = useState(""); // ✅ Добавляем состояние для пароля
    const [step, setStep] = useState(1); // 1 - ввод номера, 2 - ввод кода
    const [errorMessage, setErrorMessage] = useState(""); // Ошибки

    useEffect(() => {
        if (!isAuthModalOpen) {
            setPhone("+7 ");
            setSmsCode("");
            setPassword(""); // ✅ Очищаем пароль при закрытии
            setStep(1);
            setErrorMessage("");
        }
    }, [isAuthModalOpen]);


    // ✅ Форматирование номера в маску +7 (999) 999-99-99
    const formatPhoneNumber = (value) => {
        let numbers = value.replace(/\D/g, ""); // Убираем все нецифровые символы


        if (!numbers.startsWith("7")) {
            numbers = "7" + numbers; // Принудительно добавляем 7 в начало
        }

        return (
            "+7 " +
            (numbers[1] ? `(${numbers.slice(1, 4)}` : "") +
            (numbers[4] ? `) ${numbers.slice(4, 7)}` : "") +
            (numbers[7] ? `-${numbers.slice(7, 9)}` : "") +
            (numbers[9] ? `-${numbers.slice(9, 11)}` : "")
        );
    };

    const handlePhoneChange = (e) => {
        const formattedNumber = formatPhoneNumber(e.target.value);
        setPhone(formattedNumber);
        setErrorMessage(""); // Сброс ошибки при исправлении
    };

    const validatePhone = () => {
        const cleanNumber = phone.replace(/\D/g, "");
        if (cleanNumber.length !== 11) {
            setErrorMessage("введите корректный номер телефона.");
            return false;
        }
        return true;
    };

    const handleRequestSMS = async () => {
        if (!validatePhone()) {
            console.log("🚨 Номер телефона некорректный!");
            return;
        }

        const cleanNumber = phone.replace(/\D/g, ""); // Удаляем все нецифровые символы
        console.log(`📞 Отправляем запрос на сервер с номером: ${cleanNumber}`);

        try {
            const response = await api.post('/auth/request-sms', { phone: cleanNumber });
            console.log("✅ Ответ сервера:", response.data);
            const debugCode = response.data?.debugCode;
            if (debugCode) {
                alert(`Тестовый СМС-код: ${debugCode}`);
            }

            if (response.data?.authMode === "password") {
                // ✅ Это админ, запрашиваем пароль вместо кода
                setStep(3); // Новый шаг для ввода пароля
            } else {
                // ✅ Обычный пользователь, запрашиваем код
                setStep(2);
            }

            setErrorMessage("");
        } catch (error) {
            console.error("❌ Ошибка при запросе SMS:", error);
            setErrorMessage("ошибка при отправке SMS, попробуйте снова.");
        }
    };


    const handleLogin = async () => {
        if (!smsCode || smsCode.length < 4) {
            setErrorMessage("введите корректный код из SMS.");
            return;
        }

        try {
            const response = await api.post('/auth/login', { phone, smsCode });
            await applyAuthResponse(response.data);
            if (onLoginSuccess) onLoginSuccess();
        } catch (error) {
            console.error("Ошибка при авторизации:", error);
            setErrorMessage("неверный код, попробуйте снова.");
        }
    };

    const handleAdminLogin = async () => {
        if (!password) {
            setErrorMessage("Введите пароль.");
            return;
        }

        try {
            const response = await api.post('/auth/admin-login', {
                phone: phone.replace(/\D/g, ""), // Очищаем номер
                password,
            });

            await applyAuthResponse({ ...response.data, role: response.data?.role || "admin" });
            if (onLoginSuccess) onLoginSuccess();
        } catch (error) {
            console.error("Ошибка при входе админа:", error);
            setErrorMessage("неверный пароль.");
        }
    };


    return (
        isAuthModalOpen && (
            <div className="modal-overlay" onClick={toggleAuthModal}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <button className="close-button" onClick={toggleAuthModal}>×</button>
                    <p className="modal-title">АВТОРИЗАЦИЯ ПО НОМЕРУ ТЕЛЕФОНА</p>

                   {step === 1 ? (
                        <>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={phone}
                                onChange={handlePhoneChange}
                                placeholder="+7 (___) ___-__-__"
                                required
                                maxLength={18}
                            />
                            {errorMessage && <p className="error-message">{errorMessage}</p>}

                            <button onClick={handleRequestSMS} className="submit-button">
                                ПОЛУЧИТЬ КОД
                            </button>
                        </>
                    ) : step === 2 ? (
                        <>
                            <input
                                type="text"
                                id="smsCode"
                                name="smsCode"
                                value={smsCode}
                                onChange={(e) => setSmsCode(e.target.value)}
                                placeholder="Введите код из SMS"
                                required
                                maxLength={6}
                            />
                            {errorMessage && <p className="error-message">{errorMessage}</p>}

                            <button onClick={handleLogin} className="submit-button">
                                ВОЙТИ
                            </button>
                        </>
                    ) : (
                        // ✅ Новый шаг для входа администратора по паролю
                        <>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Введите пароль для администратора"
                                required
                            />
                            {errorMessage && <p className="error-message">{errorMessage}</p>}

                            <button onClick={handleAdminLogin} className="submit-button">
                                ВОЙТИ КАК АДМИН
                            </button>
                        </>
                    )}
                </div>
            </div>
        )
    );
};

export default AuthModal;
