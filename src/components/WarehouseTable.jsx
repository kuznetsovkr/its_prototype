import React, { useState } from "react";
import axios from "axios";

const popularTypes = ["Худи", "Футболка", "Кофта", "Свитшот", "Майка"];
const popularColors = ["Черный", "Белый", "Серый", "Красный", "Синий"];
const popularSizes = ["S", "M", "L", "XL", "XXL"];

const WarehouseTable = ({ inventory, fetchInventory, deleteItem }) => {
    const [editingItemId, setEditingItemId] = useState(null);
    const [editData, setEditData] = useState({});
    const [newImage, setNewImage] = useState(null);

    const startEditing = (item) => {
        setEditingItemId(item.id);
        setEditData({ ...item });
        setNewImage(null); // Сброс фото
    };

    const handleEditChange = (e, field) => {
        setEditData({ ...editData, [field]: e.target.value });
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await axios.post("http://localhost:5000/api/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setNewImage(response.data.imageUrl); // Сохраняем ссылку на новое фото
        } catch (err) {
            console.error("Ошибка загрузки изображения:", err);
        }
    };

    const saveEdit = async () => {
        try {
            const updatedData = { ...editData };
            if (newImage) {
                updatedData.imageUrl = newImage; // Если фото обновилось, добавляем его в объект
            }

            await axios.put(`http://localhost:5000/api/inventory/${editData.id}`, updatedData);
            setEditingItemId(null);
            fetchInventory();
        } catch (err) {
            console.error("Ошибка при обновлении товара:", err);
        }
    };

    return (
        <table border="1" cellPadding="10" style={{ width: "100%" }}>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Тип</th>
                    <th>Фото</th>
                    <th>Цвет</th>
                    <th>Размер</th>
                    <th>Количество</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
                {inventory.map((item) => (
                    <tr key={item.id}>
                        <td>{item.id}</td>

                        {/* 🔹 Выбор или ввод типа */}
                        <td>
                            {editingItemId === item.id ? (
                                <input
                                    list="types"
                                    value={editData.productType}
                                    onChange={(e) => handleEditChange(e, "productType")}
                                />
                            ) : (
                                item.productType
                            )}
                            <datalist id="types">
                                {popularTypes.map((type) => (
                                    <option key={type} value={type} />
                                ))}
                            </datalist>
                        </td>

                        {/* 🔹 Фото + обновление */}
                        <td>
                            {item.imageUrl ? (
                                <img
                                    src={newImage ? `http://localhost:5000${newImage}` : `http://localhost:5000${item.imageUrl}`}
                                    alt="Товар"
                                    width="50"
                                    height="50"
                                />
                            ) : (
                                "Нет фото"
                            )}
                            {editingItemId === item.id && (
                                <input type="file" onChange={handleFileUpload} />
                            )}
                        </td>

                        {/* 🔹 Выбор или ввод цвета */}
                        <td>
                            {editingItemId === item.id ? (
                                <input
                                    list="colors"
                                    value={editData.color}
                                    onChange={(e) => handleEditChange(e, "color")}
                                />
                            ) : (
                                item.color
                            )}
                            <datalist id="colors">
                                {popularColors.map((color) => (
                                    <option key={color} value={color} />
                                ))}
                            </datalist>
                        </td>

                        {/* 🔹 Выбор или ввод размера */}
                        <td>
                            {editingItemId === item.id ? (
                                <input
                                    list="sizes"
                                    value={editData.size}
                                    onChange={(e) => handleEditChange(e, "size")}
                                />
                            ) : (
                                item.size
                            )}
                            <datalist id="sizes">
                                {popularSizes.map((size) => (
                                    <option key={size} value={size} />
                                ))}
                            </datalist>
                        </td>

                        {/* 🔹 Количество */}
                        <td>
                            {editingItemId === item.id ? (
                                <input
                                    type="number"
                                    value={editData.quantity}
                                    onChange={(e) => handleEditChange(e, "quantity")}
                                />
                            ) : (
                                item.quantity
                            )}
                        </td>

                        {/* 🔹 Действия */}
                        <td>
                            {editingItemId === item.id ? (
                                <button onClick={saveEdit}>Сохранить</button>
                            ) : (
                                <button onClick={() => startEditing(item)}>Редактировать</button>
                            )}
                            <button onClick={() => deleteItem(item.id)}>Удалить</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default WarehouseTable;
