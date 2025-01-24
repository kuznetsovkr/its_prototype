import React, { useState } from 'react';
import './Header.css';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../images/logo_its.jpg';
import auth from '../images/free-icon-font-user-3917688.svg';

const Header = () => {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [orderStatus, setOrderStatus] = useState(null);
    const [orderNumber, setOrderNumber] = useState('');
    const navigate = useNavigate();

    const toggleAuthModal = () => setIsAuthModalOpen(!isAuthModalOpen);
    const toggleOrderModal = () => setIsOrderModalOpen(!isOrderModalOpen);

    const handleOrderSubmit = (e) => {
        e.preventDefault();
        // Пример статуса заказа. Можно заменить на реальный запрос к API.
        setOrderStatus(`Статус заказа №${orderNumber}: В пути`);
    };

    return (
        <>
            <header className="header">
                <div className="logo" onClick={() => navigate('/')}>
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

                <div className="auth-button">
                    <img
                        src={auth}
                        alt="auth"
                        className="auth-button"
                        onClick={toggleAuthModal}
                    />
                </div>
            </header>

            {/* Модальное окно авторизации */}
            {isAuthModalOpen && (
                <div className="modal-overlay" onClick={toggleAuthModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-button" onClick={toggleAuthModal}>×</button>
                        <h2>Вход</h2>
                        <form className="auth-form">
                            <label htmlFor="phone">Мобильный телефон:</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                placeholder="+7 (___) ___-__-__"
                                required
                            />
                            <button type="submit" className="submit-button">Войти</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Модальное окно отслеживания заказа */}
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
