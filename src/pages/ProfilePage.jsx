import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
    const navigate = useNavigate();
     const [role, setRole] = useState(localStorage.getItem("role") || "user");
    const [userData, setUserData] = useState({
        firstName: "",
        lastName: "",
        middleName: "",
        birthDate: "",
        phone: "",
    });

    const [isEditing, setIsEditing] = useState(false);
    const [isUserAuthenticated, setIsUserAuthenticated] = useState(!!localStorage.getItem("token"));

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
        }
    }, [isUserAuthenticated]);

    // ✅ Функция обновления данных
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

    // ✅ Функция выхода
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.dispatchEvent(new Event("storage"));
        navigate("/");
    };
    return (
        <div style={{ display: "flex", padding: "20px", gap: "20px" }}>
            <div style={{ display: "flex", padding: "20px", gap: "20px" }}>
                <div style={{ flex: 1, borderRight: "1px solid #ccc", paddingRight: "20px" }}>
                    <h1>Профиль</h1>
                    <p><strong>Роль:</strong> {role === "admin" ? "Администратор" : "Пользователь"}</p>

                    {role === "admin" ? (
                        <button onClick={() => navigate("/admin-panel")}>
                            Перейти в админ-панель
                        </button>
                    ) : (
                        <button onClick={() => navigate("/order-history")}>
                            История заказов
                        </button>
                    )}

                    <button onClick={handleLogout}>Выйти</button>
                </div>
            </div>
            {/* Левая колонка */}
            <div style={{ flex: 1, borderRight: "1px solid #ccc", paddingRight: "20px" }}>
                <h1>Профиль</h1>

                <label>Фамилия:</label>
                <input
                    type="text"
                    name="lastName"
                    value={userData.lastName}
                    onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                    disabled={!isEditing}
                />

                <label>Имя:</label>
                <input
                    type="text"
                    name="firstName"
                    value={userData.firstName}
                    onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                    disabled={!isEditing}
                />

                <label>Отчество:</label>
                <input
                    type="text"
                    name="middleName"
                    value={userData.middleName}
                    onChange={(e) => setUserData({ ...userData, middleName: e.target.value })}
                    disabled={!isEditing}
                />

                <label>Дата рождения:</label>
                <input
                    type="date"
                    name="birthDate"
                    value={userData.birthDate}
                    onChange={(e) => setUserData({ ...userData, birthDate: e.target.value })}
                    disabled={!isEditing}
                />

                <label>Телефон:</label>
                <input type="tel" name="phone" value={userData.phone} disabled />

                {/* Кнопки */}
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        style={{
                            marginTop: "10px",
                            padding: "10px 20px",
                            backgroundColor: "#007bff",
                            color: "#fff",
                            border: "none",
                            cursor: "pointer",
                            borderRadius: "5px",
                        }}
                    >
                        Редактировать
                    </button>
                ) : (
                    <button
                        onClick={handleSave}
                        style={{
                            marginTop: "10px",
                            padding: "10px 20px",
                            backgroundColor: "#28a745",
                            color: "#fff",
                            border: "none",
                            cursor: "pointer",
                            borderRadius: "5px",
                        }}
                    >
                        Сохранить
                    </button>
                )}

                {/* Кнопка "Выйти" */}
                <button
                    onClick={handleLogout}
                    style={{
                        marginTop: "20px",
                        padding: "10px 20px",
                        backgroundColor: "#dc3545",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        borderRadius: "5px",
                    }}
                >
                    Выйти
                </button>
            </div>
        </div>
    );
};

export default ProfilePage;
