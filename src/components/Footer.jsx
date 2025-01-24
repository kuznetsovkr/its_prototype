import React from 'react';
import './Footer.css';


const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="contact-info">
                    <p>Контактный номер: <a href="tel:+79991234567">+7 (999) 123-45-67</a></p>
                    <p>Email: <a href="mailto:info@embroideryshop.ru">info@embroideryshop.ru</a></p>
                </div>

                <div className="social-links">
                    <a href="" target="_blank" rel="noopener noreferrer">
                        <img  alt="VK" className="social-icon" />
                    </a>
                    <a href="" target="_blank" rel="noopener noreferrer">
                        <img alt="Telegram" className="social-icon" />
                    </a>
                    <a href="" target="_blank" rel="noopener noreferrer">
                        <img  alt="Instagram" className="social-icon" />
                    </a>
                </div>

                <div className="size-guide">
                    <a href="/size-guide" className="size-guide-link">Размерная сетка</a>
                </div>
            </div>
            <p>© 2025 Магазин Вышивки. Все права защищены.</p>
        </footer>
    );
};

export default Footer;
