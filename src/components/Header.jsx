import React from 'react';
import './Header.css';
import logo from '../images/logo_its.jpg';
import auth from '../images/free-icon-font-user-3917688.svg';

const Header = () => {
    return (
        <header className="header">
            <div className="logo">
                <img src={logo} alt="Logo"/>
            </div>

            <nav className="navigation">
                <a href="#works" className="nav-link">Примеры работ</a>
                <a href="#about" className="nav-link">О нас</a>
                <a href="#delivery" className="nav-link">Доставка и оплата</a>
            </nav>

            <div className="order-tracking">
                <button
                    className="track-order-button"
                    onClick={() => console.log('Tracking order!')}
                >
                    Отследить заказ
                </button>
            </div>

            <div className="auth-button">
                <img
                    src={auth}
                    alt="auth"
                    className="auth-button"
                    onClick={() => console.log('auth clicked!')}
                />
            </div>
        </header>
    );
};

export default Header;
