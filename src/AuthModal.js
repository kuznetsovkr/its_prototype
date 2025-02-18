import React, { useState, useEffect } from "react";
import axios from "axios";

const AuthModal = ({ isAuthModalOpen, toggleAuthModal, onLoginSuccess }) => {
    const [phone, setPhone] = useState("");
    const [smsCode, setSmsCode] = useState("");
    const [step, setStep] = useState(1); // 1 - ввод номера, 2 - ввод кода
    const [errorMessage, setErrorMessage] = useState(""); // ✅ Ошибки

    // ✅ Сбрасываем форму при закрытии окна
    useEffect(() => {
        if (!isAuthModalOpen) {
            setPhone("");
            setSmsCode("");
            setStep(1);
            setErrorMessage("");
        }
    }, [isAuthModalOpen]);

    const handleRequestSMS = async () => {
        try {
            await axios.post("http://localhost:5000/api/auth/request-sms", { phone });
            setStep(2);
            setErrorMessage(""); // Очистка ошибок при успешной отправке
        } catch (error) {
            console.error("Ошибка при запросе SMS:", error);
            setErrorMessage("Ошибка при отправке SMS. Попробуйте снова.");
        }
    };

    const handleLogin = async () => {
        try {
            const response = await axios.post("http://localhost:5000/api/auth/login", { phone, smsCode });
            localStorage.setItem("token", response.data.token);
            
            if (onLoginSuccess) onLoginSuccess();
        } catch (error) {
            console.error("Ошибка при авторизации:", error);
            setErrorMessage("Неверный код. Попробуйте снова.");
        }
    };

    return (
        isAuthModalOpen && (
            <div className="modal-overlay" onClick={toggleAuthModal}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <button className="close-button" onClick={toggleAuthModal}>×</button>
                    <h2>Вход</h2>

                    {step === 1 ? (
                        <>
                            <label htmlFor="phone">Мобильный телефон:</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+7 (___) ___-__-__"
                                required
                            />
                            <button onClick={handleRequestSMS} className="submit-button">
                                Получить код
                            </button>
                        </>
                    ) : (
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
                            />
                            <button onClick={handleLogin} className="submit-button">
                                Войти
                            </button>
                        </>
                    )}

                    {/* 🔹 Вывод ошибки */}
                    {errorMessage && <p style={{ color: "red", marginTop: "10px" }}>{errorMessage}</p>}
                </div>
            </div>
        )
    );
};

export default AuthModal;
