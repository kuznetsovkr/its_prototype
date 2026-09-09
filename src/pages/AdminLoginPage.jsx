import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { applyAdminAuthResponse } from "../utils/auth";

const AdminLoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const normalizedPhone = phone.replace(/\D/g, "");
    if (!normalizedPhone || !password) {
      setError("Введите телефон и пароль администратора.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await api.post("/auth/admin-login", {
        phone: normalizedPhone,
        password,
      });
      applyAdminAuthResponse(data);
      navigate(location.state?.from || "/admin/inventory", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Не удалось войти в админку.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="admin-login-page" aria-labelledby="admin-login-title">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <div className="admin-login-card__mark" aria-hidden="true">
          <span>итс</span>
          <small>admin</small>
        </div>

        <div className="admin-login-card__heading">
          <p className="admin-login-card__eyebrow">служебный раздел</p>
          <h1 id="admin-login-title">вход в админку</h1>
          <p>Управляйте каталогом и остатками в одном месте.</p>
        </div>

        <div className="admin-login-card__fields">
          <label className="admin-login-field">
            <span>Телефон</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="username"
              placeholder="+7 999 000-00-00"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </label>

          <label className="admin-login-field">
            <span>Пароль</span>
            <span className="admin-login-field__password">
              <input
                type={isPasswordVisible ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Введите пароль"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="admin-login-field__toggle"
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                aria-label={isPasswordVisible ? "Скрыть пароль" : "Показать пароль"}
                aria-pressed={isPasswordVisible}
              >
                {isPasswordVisible ? "скрыть" : "показать"}
              </button>
            </span>
          </label>
        </div>

        {error && <p className="admin-login-card__error" role="alert">{error}</p>}

        <button className="admin-login-card__submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Входим…" : "Войти"}
        </button>

        <Link className="admin-login-card__back" to="/">
          ← Вернуться на сайт
        </Link>
      </form>
    </section>
  );
};

export default AdminLoginPage;
