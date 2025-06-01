import vkIcon from '../images/vk-icon.svg';
import telegramIcon from '../images/telegram-icon.svg';
import instagramIcon from '../images/instagram-icon.svg';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="social-links">
                    <a href="https://vk.com/its.custom" target="_blank" rel="noopener noreferrer">
                        <img src={vkIcon} alt="VK" className="social-icon" />
                    </a>
                    <a href="https://t.me/alexchudaev123" target="_blank" rel="noopener noreferrer">
                        <img src={telegramIcon} alt="Telegram" className="social-icon" />
                    </a>
                    <a href="https://www.instagram.com/i.tak_soydet" target="_blank" rel="noopener noreferrer">
                        <img src={instagramIcon} alt="Instagram" className="social-icon" />
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
