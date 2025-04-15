import React, { useState, useEffect } from "react";
import axios from "axios";
import WarehouseTable from "../components/WarehouseTable"; 

const popularTypes = ["Худи", "Футболка", "Кофта", "Свитшот", "Майка"];
const popularColors = ["Черный", "Белый", "Серый", "Красный", "Синий"];
const popularSizes = ["XS", "S", "M", "L", "XL", "XXL"];

const AdminInventory = () => {
    const [inventory, setInventory] = useState([]);
    const [newItem, setNewItem] = useState({
        productType: "",
        color: "",
        size: "",
        quantity: 0,
    });

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/inventory");
            setInventory(response.data);
        } catch (err) {
            console.error("Ошибка загрузки склада:", err);
        }
    };

    const updateQuantity = async (id, quantity) => {
        try {
            await axios.put(`http://localhost:5000/api/inventory/${id}`, { quantity });
            fetchInventory();
        } catch (err) {
            console.error("Ошибка обновления:", err);
        }
    };

    const deleteItem = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/inventory/${id}`);
            fetchInventory();
        } catch (err) {
            console.error("Ошибка удаления:", err);
        }
    };

    const addItem = async () => {
        if (!newItem.productType || !newItem.color || !newItem.size || newItem.quantity <= 0) {
            alert("Заполните все поля корректно!");
            return;
        }

        try {
            await axios.post("http://localhost:5000/api/inventory", newItem);
            setNewItem({ productType: "", color: "", size: "", quantity: 0 });
            fetchInventory();
        } catch (err) {
            console.error("Ошибка добавления:", err);
        }
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
    
            setNewItem({ ...newItem, imageUrl: response.data.imageUrl }); // Сохраняем URL в `newItem`
        } catch (err) {
            console.error("Ошибка загрузки изображения:", err);
        }
    };
    

    return (
        <div style={{ padding: "20px" }}>
            <h1>Управление складом</h1>

            {/* 🔹 Форма добавления */}
            <div style={{ marginBottom: "20px" }}>
                <label>Тип одежды:</label>
                <input
                    list="types"
                    type="text"
                    placeholder="Выберите или введите свой тип"
                    value={newItem.productType}
                    onChange={(e) => setNewItem({ ...newItem, productType: e.target.value })}
                />
                <datalist id="types">
                    {popularTypes.map((type) => (
                        <option key={type} value={type} />
                    ))}
                </datalist>

                <label>Цвет:</label>
                <input
                    list="colors"
                    type="text"
                    placeholder="Выберите или введите свой цвет"
                    value={newItem.color}
                    onChange={(e) => setNewItem({ ...newItem, color: e.target.value })}
                />
                <datalist id="colors">
                    {popularColors.map((color) => (
                        <option key={color} value={color} />
                    ))}
                </datalist>

                <label>Размер:</label>
                <input
                    list="sizes"
                    type="text"
                    placeholder="Выберите или введите свой размер"
                    value={newItem.size}
                    onChange={(e) => setNewItem({ ...newItem, size: e.target.value })}
                />
                <datalist id="sizes">
                    {popularSizes.map((size) => (
                        <option key={size} value={size} />
                    ))}
                </datalist>

                <label>Количество:</label>
                <input
                    type="number"
                    placeholder="Количество"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                />
                
                <label>Загрузить изображение:</label>
                <input type="file" onChange={handleFileUpload} />
                {newItem.imageUrl && <img src={`http://localhost:5000${newItem.imageUrl}`} alt="Превью" width="100" />}

                <button onClick={addItem}>Добавить</button>
            </div>

            <WarehouseTable 
                inventory={inventory} 
                updateQuantity={updateQuantity} 
                deleteItem={deleteItem} 
            />
        </div>
    );
};

export default AdminInventory;
