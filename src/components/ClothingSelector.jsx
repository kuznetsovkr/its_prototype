import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { RadioGroup } from '@headlessui/react';
import infoIcon from "../images/free-icon-font-info-3916699.png";

const colorHex = {
  black: "#000000",
  blue: "#0000FF",
  brown: "#8B4513",
  gray: "#808080",
  green: "#008000",
  red: "#FF0000",
  orange: "#FFA500",
  pink: "#FFC0CB",
  purple: "#800080",
  yellow: "#FFFF00"
};

const ClothingSelector = () => {
  const navigate = useNavigate();

  const [inventory, setInventory] = useState([]); // Данные склада
  const [selectedClothing, setSelectedClothing] = useState(""); // Выбранный тип
  const [selectedColor, setSelectedColor] = useState(""); // Выбранный цвет
  const [selectedSize, setSelectedSize] = useState(""); // Выбранный размер

  // Загружаем склад
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/inventory");
        const data = response.data;
        setInventory(data);
  
        // Выбираем первый доступный тип одежды
        const firstType = [...new Set(data.map(item => item.productType))][0];
        if (firstType) {
          setSelectedClothing(firstType);
        }
  
      } catch (err) {
        console.error("Ошибка загрузки склада:", err);
      }
    };
    fetchInventory();
  }, []);
  
  //  Получаем уникальные типы одежды
  const availableTypes = [...new Set(inventory.map(item => item.productType))];

  //  Доступные цвета для выбранного типа
  const availableColors = [...new Set(inventory
    .filter(item => item.productType === selectedClothing)
    .map(item => item.color)
  )];

  //  Доступные размеры для выбранного типа и цвета
  const availableSizes = inventory
    .filter(item => item.productType === selectedClothing && item.color === selectedColor)
    .reduce((sizes, item) => {
      if (!sizes.includes(item.size)) sizes.push(item.size);
      return sizes;
    }, []);

  //  Обновляем выбранный цвет (по умолчанию первый доступный)
  useEffect(() => {
    if (availableColors.length > 0) {
      setSelectedColor(availableColors[0]);
    } else {
      setSelectedColor("");
    }
  }, [selectedClothing]);

  //  Обновляем выбранный размер (по умолчанию первый доступный)
  useEffect(() => {
    // Если доступных размеров нет, сбрасываем выбор
    if (availableSizes.length === 0) {
      setSelectedSize("");
    }
  }, [selectedColor]);

  const handleConfirm = () => {
    if (selectedSize) {
      navigate("/embroidery", {
        state: { selectedClothing, selectedSize, selectedColor }
      });
    }
  };

  return (
    <div className="blockClothingSelector">
      {/* Левая часть: изображение товара */}
      <div className="clothing-block">
        <div className="image-wrapper">
          {selectedClothing && selectedColor ? (
            <img
              src={`http://localhost:5000${inventory.find(item => item.productType === selectedClothing && item.color === selectedColor)?.imageUrl || "placeholder.png"}`}
              alt={selectedClothing}
              className="clotheImage"
            />
          ) : (
            <img src="placeholder.png" alt="Выберите одежду" className="clotheImage" />
          )}
          <div className="info-icon-wrapper">
            <img src={infoIcon} alt="Info" className="info-icon" />
            <div className="tooltip">Состав: 100% хлопок</div>
          </div>
        </div>
      </div>


      {/* Правая часть */}
      <div className="blockSelection">

        <div className="selectorGroup">
          <p className="title">Тип изделия:</p>
          <div className="selector">
            {availableTypes.map(type => (
              <label key={type}>
                <input
                  type="radio"
                  name="clothing"
                  value={type}
                  checked={selectedClothing === type}
                  onChange={(e) => setSelectedClothing(e.target.value)}
                />
                {type}
              </label>
            ))}
          </div>
        </div>
        
        <div className="selectorGroup">
          <p className="title">Цвет:</p>
          <div className="colorSelector">
            {availableColors.map(color => (
              <div
                key={color}
                className={`colorSquare ${selectedColor === color ? "active" : ""}`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>
        </div>

        {/* Выбор размера */}
        <div className="selectorGroup">
          <p className="title">Размер:</p>
          <div className="sizeSelector">
            {["XS","S", "M", "L", "XL", "XXL"].map(size => {
              const isAvailable = availableSizes.includes(size);
              return (
                <label
                  key={size}
                  className={`sizeLabel ${!isAvailable ? "disabled" : ""}`}
                >
                  <input
                    type="radio"
                    name="size"
                    value={size}
                    checked={selectedSize === size}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    disabled={!isAvailable}
                  />
                  <span className="sizeCircle">{size}</span>
                </label>
              );
            })}
          </div>
        </div>


        <button
          className="confirmButton"
          onClick={handleConfirm}
          disabled={!selectedSize}
        >
          Перейти к вышивке
        </button>
      </div>
    </div>
  );
};

export default ClothingSelector;