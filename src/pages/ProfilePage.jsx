import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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

  const fetchOrders = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const endpoint = role === "admin" ? "http://localhost:5000/api/orders/all" : "http://localhost:5000/api/orders/user";
            const response = await fetch(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setOrders(data);
            }
        } catch (error) {
            console.error("Ошибка получения заказов:", error);
        }
    };

  useEffect(() => {
    setRole(localStorage.getItem("role") || "user");

    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch("http://localhost:5000/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setUserData({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            middleName: data.middleName || "",
            birthDate: data.birthDate || "",
            phone: data.phone || "",
          });
        }
      } catch (error) {
        console.error("Ошибка получения данных пользователя:", error);
      }
    };

    if (isUserAuthenticated) {
      fetchUserData();
      fetchOrders(role);
    }
  }, [isUserAuthenticated]);

  // Сохранение данных
  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:5000/api/user/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        alert("Данные успешно обновлены!");
        setIsEditing(false);
      } else {
        alert("Ошибка обновления данных.");
      }
    } catch (error) {
      console.error("Ошибка обновления данных:", error);
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
    <div className="profile-page">
      {/* Левая колонка */}
      <div className="profile-sidebar">
        {role === "admin" && (
           <button onClick={() => navigate("/admin/inventory")}>Управление складом</button>          
        )}

               <div className="user-info">
          <label>Фамилия:</label>
          <input
            type="text"
            value={userData.lastName}
            onChange={(e) =>
              setUserData({ ...userData, lastName: e.target.value })
            }
            disabled={!isEditing}
          />

          <label>Имя:</label>
          <input
            type="text"
            value={userData.firstName}
            onChange={(e) =>
              setUserData({ ...userData, firstName: e.target.value })
            }
            disabled={!isEditing}
          />

          <label>Отчество:</label>
          <input
            type="text"
            value={userData.middleName}
            onChange={(e) =>
              setUserData({ ...userData, middleName: e.target.value })
            }
            disabled={!isEditing}
          />

          <label>Дата рождения:</label>
          <input
            type="date"
            value={userData.birthDate}
            onChange={(e) =>
              setUserData({ ...userData, birthDate: e.target.value })
            }
            disabled={!isEditing}
          />

          <label>Телефон:</label>
          <input
            type="tel"
            value={userData.phone}
            disabled
          />
        </div>

        {/* Блок с кнопками "Редактировать / Сохранить" и "Выйти" */}
        <div className="profile-actions">
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)}>
              Редактировать
            </button>
          ) : (
            <button onClick={handleSave}>
              Сохранить
            </button>
          )}
          <button onClick={handleLogout}>
            Выйти
          </button>
        </div>      
</div>

      {/* Правая колонка с заказами */}
      <div className="profile-content">
        <h2>История заказов</h2>
        {orders.length > 0 ? (
          <table className="orders-table">
            <thead>
              <tr>
                 {role === "admin" && <th>Пользователь</th>} {/* 👀 Показываем имя только админам */}
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
        ) : (
          <p>Ещё нет заказов</p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
