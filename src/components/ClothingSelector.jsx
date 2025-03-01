import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import infoIcon from "../images/free-icon-font-info-3916699.png";

import blackTShirt from "../images/t-shirts/t_shirt_black.webp";
import blueTShirt from "../images/t-shirts/t_shirt_blue.webp";
import grayTShirt from "../images/t-shirts/t_shirt_gray.webp";
import greenTShirt from "../images/t-shirts/t_shirt_green.webp";
import redTShirt from "../images/t-shirts/t_shirt_red.webp";

import blackHoodie from "../images/hoodies/hoodies_black.webp";
import brownHoodie from "../images/hoodies/hoodies_brown.webp";
import greenHoodie from "../images/hoodies/hoodies_green.webp";
import orangeHoodie from "../images/hoodies/hoodies_orange.webp";
import pinkHoodie from "../images/hoodies/hoodies_pink.webp";
import purpleHoodie from "../images/hoodies/hoodies_purple.webp";

import blackLongsleeve from "../images/longsleeve/long_black.webp";
import blueLongsleeve from "../images/longsleeve/long_blue.webp";
import greenLongsleeve from "../images/longsleeve/long_green.webp";
import yellowLongsleeve from "../images/longsleeve/long_yellow.webp";


const ClothingSelector = () => {
  const [selectedClothing, setSelectedClothing] = useState("tshirt");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("black");

  const navigate = useNavigate();

  const clothingImages = {
    tshirt: {
      black: blackTShirt,
      blue: blueTShirt,
      gray: grayTShirt,
      green: greenTShirt,
      red: redTShirt
    },
    hoodies: {
      black: blackHoodie,
      brown: brownHoodie,
      green: greenHoodie,
      orange: orangeHoodie,
      pink: pinkHoodie,
      purple: purpleHoodie
    },
    longsleeve: {
      black: blackLongsleeve,
      blue: blueLongsleeve,
      green: greenLongsleeve,
      yellow: yellowLongsleeve
    }
  };

  const clothingColors = {
    tshirt: ["black", "blue", "gray", "green", "red"],
    hoodies: ["black", "brown", "green", "orange", "pink", "purple"],
    longsleeve: ["black", "blue", "green", "yellow"]
  };

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

  const getClothingImage = () =>
    clothingImages[selectedClothing]?.[selectedColor];

  useEffect(() => {
    // При смене типа изделия переключаем цвет на первый доступный
    setSelectedColor(clothingColors[selectedClothing]?.[0] || "black");
  }, [selectedClothing]);

  const handleConfirm = () => {
    if (selectedSize) {
      navigate("/embroidery", {
        state: { selectedClothing, selectedSize, selectedColor }
      });
    }
  };

  return (
    <div className="blockClothingSelector">
      {/* Левая часть: изображение выбранного изделия + иконка */}
      <div className="clothing-block">
        <div className="image-wrapper">
          <img
            src={getClothingImage()}
            alt={selectedClothing}
            className="clotheImage"
          />
            <div className="info-icon-wrapper">
                <img src={infoIcon} alt="Info" className="info-icon" />
                <div className="tooltip">Состав: 100% хлопок</div>
            </div>
        </div>
      </div>

      {/* Правая часть: выбор типа, цвета и размера */}
      <div className="blockSelection">

        <div className="selectorGroup">
          <h3>Тип изделия:</h3>
          <div className="selector">
            {["tshirt", "hoodies", "longsleeve"].map((type) => (
              <label key={type}>
                <input
                  type="radio"
                  name="clothing"
                  value={type}
                  checked={selectedClothing === type}
                  onChange={(e) => setSelectedClothing(e.target.value)}
                />
                {type === "tshirt"
                  ? "Футболка"
                  : type === "hoodies"
                  ? "Худи"
                  : "Лонгслив"}
              </label>
            ))}
          </div>
        </div>

        <div className="selectorGroup">
          <h3>Цвет:</h3>
          <div className="colorSelector">
            {clothingColors[selectedClothing]?.map((color) => (
              <div
                key={color}
                className={`colorSquare ${
                  selectedColor === color ? "active" : ""
                }`}
                style={{ backgroundColor: colorHex[color] }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>
        </div>

        <div className="selectorGroup">
          <h3>Размер:</h3>
          <div className="selector">
            {["S", "M", "L", "XL"].map((size) => (
              <label key={size}>
                <input
                  type="radio"
                  name="size"
                  value={size}
                  checked={selectedSize === size}
                  onChange={(e) => setSelectedSize(e.target.value)}
                />
                {size}
              </label>
            ))}
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
