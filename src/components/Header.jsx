import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../images/logo_its.jpg";
import auth from "../images/free-icon-font-user-3917688.svg";
import AuthModal from "../AuthModal";

const Header = () => {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [orderStatus, setOrderStatus] = useState(null);
    const [orderNumber, setOrderNumber] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
    const navigate = useNavigate();

    const toggleOrderModal = () => setIsOrderModalOpen(!isOrderModalOpen);

    const handleOrderSubmit = (e) => {
        e.preventDefault();
        setOrderStatus(`Статус заказа №${orderNumber}: В пути`);
    };

    // 🔹 Функция успешного входа, вызывается после логина
    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
        setIsAuthModalOpen(false);
    };

    // 🔹 Следим за изменением токена в `localStorage`
    useEffect(() => {
        const handleStorageChange = () => {
            setIsAuthenticated(!!localStorage.getItem("token"));
        };

        window.addEventListener("storage", handleStorageChange);
        return () => {
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    // 🔹 Функция обработки клика на кнопку профиля
    const handleAuthClick = () => {
        if (isAuthenticated) {
            navigate("/profile");
        } else {
            setIsAuthModalOpen(true);
        }
    };

    return (
        <>
            <header className="header">
                <div className="logo" onClick={() => navigate("/")}>
                    <img src={logo} alt="Logo" />
                </div>

                <nav className="navigation">
                    <Link to="/works" className="nav-link">Примеры работ</Link>
                    <Link to="/about" className="nav-link">О нас</Link>
                    <Link to="/delivery" className="nav-link">Доставка и оплата</Link>
                </nav>

                <div className="order-tracking">
                    <button className="track-order-button" onClick={toggleOrderModal}>
                        Отследить заказ
                    </button>
                </div>

                {/* 🔹 Проверяем авторизацию перед открытием окна */}
                <div className="auth-button" onClick={handleAuthClick}>
                    <img src={auth} alt="auth" className="auth-button" />
                </div>

                {/* Передаем `onLoginSuccess`, чтобы обновлять состояние при логине */}
                <AuthModal 
                    isAuthModalOpen={isAuthModalOpen} 
                    toggleAuthModal={() => setIsAuthModalOpen(false)}
                    onLoginSuccess={handleLoginSuccess}
                />
            </header>

            {isOrderModalOpen && (
                <div className="modal-overlay" onClick={toggleOrderModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-button" onClick={toggleOrderModal}>×</button>
                        <h2>Отслеживание заказа</h2>
                        <form onSubmit={handleOrderSubmit}>
                            <label htmlFor="order">Введите номер заказа:</label>
                            <input
                                type="text"
                                id="order"
                                value={orderNumber}
                                onChange={(e) => setOrderNumber(e.target.value)}
                                placeholder="Введите номер заказа"
                                required
                            />
                            <button type="submit" className="submit-button">Проверить</button>
                        </form>
                        {orderStatus && <p className="order-status">{orderStatus}</p>}
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
