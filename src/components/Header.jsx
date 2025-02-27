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
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
    const navigate = useNavigate();

    const toggleOrderModal = () => {
        setIsOrderModalOpen(!isOrderModalOpen);
        setOrderStatus(null); // Очищаем статус при закрытии
        setOrderNumber(""); // Очищаем поле ввода
    };

    const handleOrderSubmit = async (e) => {
        e.preventDefault();
        if (!orderNumber) return;

        setIsLoading(true);
        setOrderStatus(null);

        try {
            const response = await fetch(`http://localhost:5000/api/orders/status/${orderNumber}`);
            if (response.ok) {
                const data = await response.json();
                setOrderStatus(`Статус заказа №${orderNumber}: ${data.status}`);
            } else {
                setOrderStatus("Заказ не найден. Проверьте номер.");
            }
        } catch (error) {
            console.error("Ошибка получения статуса заказа:", error);
            setOrderStatus("Ошибка сервера. Попробуйте позже.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
        setIsAuthModalOpen(false);
    };

    useEffect(() => {
        const handleStorageChange = () => {
            setIsAuthenticated(!!localStorage.getItem("token"));
        };
        window.addEventListener("storage", handleStorageChange);
        return () => {
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

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

                <div className="auth-button" onClick={handleAuthClick}>
                    <img src={auth} alt="auth" className="auth-button" />
                </div>

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
                            <button type="submit" className="submit-button" disabled={isLoading}>
                                {isLoading ? "Проверяем..." : "Проверить"}
                            </button>
                        </form>
                        {orderStatus && <p className="order-status">{orderStatus}</p>}
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
