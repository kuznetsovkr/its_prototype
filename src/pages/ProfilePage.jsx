import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from '../api';


const ProfilePage = () => {
  const navigate = useNavigate();

  // Роль (admin / user)
  const [role, setRole] = useState(localStorage.getItem("role") || "user");

  // Данные пользователя
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    birthDate: "",
    phone: "",
  });

  // Редактирование
  const [isEditing, setIsEditing] = useState(false);

  // История заказов
  const [orders, setOrders] = useState([]);

  // Авторизация
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(
    !!localStorage.getItem("token")
  );

  // === Загрузка заказов (axios) ===
  const fetchOrders = async () => {
    const token = localStorage.getItem("token");
    if (!token) { setOrders([]); return; }

    try {
      const path = role === 'admin' ? '/orders/all' : '/orders/user';

      const res = await api.get(path, {
        headers: { Authorization: `Bearer ${token}` }, // убери, если есть интерсептор
      });

      // Сервер может вернуть либо массив, либо объект { orders: [...] }
      const payload = res.data;
      const list = Array.isArray(payload) ? payload : (payload?.orders ?? []);
      setOrders(list);
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      console.error("Ошибка получения заказов:", msg);
      setOrders([]); // безопасно обнулим, чтобы не падал рендер
    }
  };

  useEffect(() => {
    setRole(localStorage.getItem("role") || "user");

    // === Загрузка данных пользователя (axios) ===
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await api.get('/user/me', {
          headers: { Authorization: `Bearer ${token}` }, // убери, если есть интерсептор
        });

        const u = res.data || {};
        setUserData({
          firstName: u.firstName || "",
          lastName:  u.lastName  || "",
          middleName:u.middleName|| "",
          birthDate: u.birthDate || "",
          phone:     u.phone     || "",
        });
      } catch (error) {
        const msg = error.response?.data?.message || error.message;
        console.error("Ошибка получения данных пользователя:", msg);
      }
    };

    if (isUserAuthenticated) {
      fetchUserData();
      fetchOrders();
    }
  }, [isUserAuthenticated, role]); // подхватываем смену роли тоже

  // Сохранение данных
  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const { data } = await api.put('/user/update', userData, {
        headers: { Authorization: `Bearer ${token}` }, // можно убрать, если есть интерсептор
      });
      // data — ответ сервера
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Неизвестная ошибка';
      console.error('Ошибка обновления данных:', msg);
    }
  };

  // Выход
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.dispatchEvent(new Event("storage"));
    navigate("/");
  };

  return (
    <section className="profile-page">
      {/* Левая колонка — профиль */}
      <div className="user-card">
        <h2 className="heading">Мой профиль</h2>

        <div className="fields">
          <div className="field">
            <label className="label">Фамилия</label>
            <input
              className="input"
              type="text"
              value={userData.lastName}
              onChange={(e) =>
                setUserData({ ...userData, lastName: e.target.value })
              }
              disabled={!isEditing}
            />
          </div>

          <div className="field">
            <label className="label">Имя</label>
            <input
              className="input"
              type="text"
              value={userData.firstName}
              onChange={(e) =>
                setUserData({ ...userData, firstName: e.target.value })
              }
              disabled={!isEditing}
            />
          </div>

          <div className="field">
            <label className="label">Отчество</label>
            <input
              className="input"
              type="text"
              value={userData.middleName}
              onChange={(e) =>
                setUserData({ ...userData, middleName: e.target.value })
              }
              disabled={!isEditing}
            />
          </div>

          <div className="field">
            <label className="label">Дата рождения</label>
            <input
              className="input"
              type="date"
              value={userData.birthDate}
              onChange={(e) =>
                setUserData({ ...userData, birthDate: e.target.value })
              }
              disabled={!isEditing}
            />
          </div>

          <div className="field">
            <label className="label">Телефон</label>
            <input className="input" type="tel" value={userData.phone} disabled />
          </div>
        </div>

        <div className="profile-actions">
          {!isEditing ? (
            <button className="btn btn-outline" onClick={() => setIsEditing(true)}>
              Редактировать
            </button>
          ) : (
            <button className="btn btn-outline" onClick={handleSave}>
              Сохранить
            </button>
          )}

          {role === "admin" && (
            <button
              className="btn btn-outline"
              onClick={() => navigate("/admin/inventory")}
            >
              Управление складом
            </button>
          )}

          <button className="btn btn-primary" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </div>

      {/* Правая колонка — заказы */}
      <div className="orders-card">
        <h2 className="heading">История заказов</h2>

        {orders.length > 0 ? (
          <div className="table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  {role === "admin" && <th>Пользователь</th>}
                  <th>Тип продукта</th>
                  <th>Дата заказа</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    {role === "admin" && <td>{order.phone || "Неизвестный"}</td>}
                    <td>{order.productType}</td>
                    <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td>{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Ещё нет заказов</p>
        )}
      </div>
    </section>
  );
};

export default ProfilePage;
