import React, { useState } from "react";

const AuthModal = ({ isAuthModalOpen, toggleAuthModal }) => {
    const [phone, setPhone] = useState("");
    const [smsCode, setSmsCode] = useState("");
    const [isCodeSent, setIsCodeSent] = useState(false);

    // Отправка запроса на SMS-код
    const requestSmsCode = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/auth/request-sms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
            });
            const data = await response.json();
            if (response.ok) {
                setIsCodeSent(true);
                alert("Код отправлен!");
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("Ошибка отправки кода:", error);
        }
    };

    // Отправка запроса на авторизацию
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, smsCode }),
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem("token", data.token);
                alert("Вы успешно вошли!");
                toggleAuthModal();
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("Ошибка авторизации:", error);
        }
    };

    return isAuthModalOpen ? (
        <div className="modal-overlay" onClick={toggleAuthModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={toggleAuthModal}>×</button>
                <h2>Вход</h2>
                <form className="auth-form" onSubmit={isCodeSent ? handleLogin : (e) => { e.preventDefault(); requestSmsCode(); }}>
                    <label htmlFor="phone">Мобильный телефон:</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+7 (___) ___-__-__"
                        required
                        disabled={isCodeSent}
                    />
                    {isCodeSent && (
                        <>
                            <label htmlFor="smsCode">Код из SMS:</label>
                            <input
                                type="text"
                                id="smsCode"
                                name="smsCode"
                                value={smsCode}
                                onChange={(e) => setSmsCode(e.target.value)}
                                required
                            />
                        </>
                    )}
                    <button type="submit" className="submit-button">
                        {isCodeSent ? "Подтвердить" : "Отправить код"}
                    </button>
                </form>
            </div>
        </div>
    ) : null;
};

export default AuthModal;
