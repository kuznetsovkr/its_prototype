import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../images/logo_its.svg";
import auth from "../images/auth.svg";
import AuthModal from "../AuthModal";

// Иконка "три полоски"
const BurgerIcon = () => (
  <div className="burger-icon">
    <span />
    <span />
    <span />
  </div>
);

const Header = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Авторизация
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );

  // Состояние бургер-меню
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigate = useNavigate();

  const toggleOrderModal = () => {
    setIsOrderModalOpen(!isOrderModalOpen);
    setOrderStatus(null);
    setOrderNumber("");
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

  // При открытии модалки -> body.style.overflow = 'hidden'
  // При закрытии -> body.style.overflow = 'auto'
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    // Чистка: если компонент размонтируется, вернуть scroll назад
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen]);

  // Переход в профиль или открытие окна авторизации
  const handleAuthClick = () => {
    if (isAuthenticated) {
      navigate("/profile");
    } else {
      setIsAuthModalOpen(true);
    }
  };

  // Открыть/закрыть бургер
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  // Запрещаем прокрутку body, если меню открыто
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isMenuOpen]);

  return (
    <>
      <header className="header">
        <div className="logo" onClick={() => navigate("/")}>
          <img src={logo} alt="Logo" />
        </div>

        {/* Навигация для десктопа */}
        <nav className="navigation desktop-only">
          <Link to="/works" className="nav-link">примеры работ</Link>
          <Link to="/about" className="nav-link">о нас</Link>
          <Link to="/faq" className="nav-link">ответы на самые частые вопросы</Link>
        </nav>

        {/* Иконка авторизации - только на десктопах */}
        <div className="auth-button desktop-only"
              onClick={() => {
                handleAuthClick();   // первое действие
              }}>
          <img src={auth} alt="auth" />
        </div>

        {/* Бургер (мобильная/планшетная версия). Скрываем его при открытом меню */}
        {!isMenuOpen && (
          <div className="mobile-only" onClick={toggleMenu}>
            <BurgerIcon />
          </div>
        )}
      </header>

      {/* Мобильное бургер-меню (выезжающее) */}
      <div className={`mobile-menu ${isMenuOpen ? "open" : ""}`}>
        <div className="mobile-menu-content">
          <button className="close-button" onClick={toggleMenu}>×</button>
          <nav className="mobile-nav">
            <Link to="/works" onClick={toggleMenu}>Примеры работ</Link>
            <Link to="/about" onClick={toggleMenu}>О нас</Link>
            <Link to="/faq" onClick={toggleMenu}>Ответы на частые вопросы</Link>

            {/*
            <button
              className="track-order-button"
              onClick={() => {
                toggleOrderModal();
                toggleMenu();
              }}
            >
              Отследить заказ
            </button>
            */}

            {/* У кнопки "Личный кабинет" уберём подсветку/hover */}
            <button
              className="mobile-profile-button"
              onClick={() => {
                handleAuthClick();
                toggleMenu();
              }}
            >
              Личный кабинет
            </button>
          </nav>
        </div>
      </div>

      {/* Модальное окно "Отследить заказ" */}
      {isOrderModalOpen && (
        <div className="modal-overlay" onClick={toggleOrderModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" 
              onClick={()=>{
                toggleOrderModal();
                setIsModalOpen(false);
              }}
            >
              ×
            </button>
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

      {/* Модалка авторизации */}
      <AuthModal
        isAuthModalOpen={isAuthModalOpen}
        toggleAuthModal={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
};

export default Header;
