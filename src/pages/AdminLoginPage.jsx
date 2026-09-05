import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { applyAuthResponse } from "../utils/auth";

const AdminLoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
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
      applyAuthResponse(data);
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
        <h1 id="admin-login-title">Вход в админку</h1>
        <label>
          <span>Телефон</span>
          <input
            type="tel"
            autoComplete="username"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={isSubmitting}
          />
        </label>
        <label>
          <span>Пароль</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
          />
        </label>
        {error && <p className="admin-login-card__error" role="alert">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Входим…" : "Войти"}
        </button>
      </form>
    </section>
  );
};

export default AdminLoginPage;
