import React, { useState, useEffect } from "react";
import axios from "axios";

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
            setErrorMessage("Введите корректный номер телефона.");
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
            const response = await axios.post("http://localhost:5000/api/auth/request-sms", { phone: cleanNumber });
            console.log("✅ Ответ сервера:", response.data);

            if (response.data.message === "Введите пароль") {
                // ✅ Это админ, запрашиваем пароль вместо кода
                setStep(3); // Новый шаг для ввода пароля
            } else {
                // ✅ Обычный пользователь, запрашиваем код
                setStep(2);
            }

            setErrorMessage("");
        } catch (error) {
            console.error("❌ Ошибка при запросе SMS:", error);
            setErrorMessage("Ошибка при отправке SMS. Попробуйте снова.");
        }
    };


    const handleLogin = async () => {
        if (!smsCode || smsCode.length < 4) {
            setErrorMessage("Введите корректный код из SMS.");
            return;
        }

        try {
            const response = await axios.post("http://localhost:5000/api/auth/login", { phone, smsCode });
            localStorage.setItem("token", response.data.token);
            if (onLoginSuccess) onLoginSuccess();
        } catch (error) {
            console.error("Ошибка при авторизации:", error);
            setErrorMessage("Неверный код. Попробуйте снова.");
        }
    };

    const handleAdminLogin = async () => {
        if (!password) {
            setErrorMessage("Введите пароль.");
            return;
        }

        try {
            const response = await axios.post("http://localhost:5000/api/auth/admin-login", {
                phone: phone.replace(/\D/g, ""), // Очищаем номер
                password,
            });

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("role", "admin"); // Сохраняем роль
            if (onLoginSuccess) onLoginSuccess();
        } catch (error) {
            console.error("Ошибка при входе админа:", error);
            setErrorMessage("Неверный пароль.");
        }
    };


    return (
        isAuthModalOpen && (
            <div className="modal-overlay" onClick={toggleAuthModal}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <button className="close-button" onClick={toggleAuthModal}>×</button>
                    <h2>Авторизация по номеру телефона</h2>

                   {step === 1 ? (
                        <>
                            <label htmlFor="phone">Введите номер телефона:</label>
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
                                Получить код
                            </button>
                        </>
                    ) : step === 2 ? (
                        <>
                            <label htmlFor="smsCode">Введите код из SMS:</label>
                            <input
                                type="text"
                                id="smsCode"
                                name="smsCode"
                                value={smsCode}
                                onChange={(e) => setSmsCode(e.target.value)}
                                placeholder="Введите код"
                                required
                                maxLength={6}
                            />
                            {errorMessage && <p className="error-message">{errorMessage}</p>}

                            <button onClick={handleLogin} className="submit-button">
                                Войти
                            </button>
                        </>
                    ) : (
                        // ✅ Новый шаг для входа администратора по паролю
                        <>
                            <label htmlFor="password">Введите пароль:</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Введите пароль"
                                required
                            />
                            {errorMessage && <p className="error-message">{errorMessage}</p>}

                            <button onClick={handleAdminLogin} className="submit-button">
                                Войти как админ
                            </button>
                        </>
                    )}
                </div>
            </div>
        )
    );
};

export default AuthModal;
