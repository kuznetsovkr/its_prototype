import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import infoIcon from "../images/free-icon-font-info-3916699.png";

import blackTShirt from "../images/t-shirts/t_shirt_black.jpg";
import blueTShirt from "../images/t-shirts/t_shirt_blue.jpg";
import grayTShirt from "../images/t-shirts/t_shirt_gray.jpg";
import greenTShirt from "../images/t-shirts/t_shirt_green.jpg";
import redTShirt from "../images/t-shirts/t_shirt_red.jpeg";

import blackHoodie from "../images/hoodies/hoodies_black.jpg";
import brownHoodie from "../images/hoodies/hoodies_brown.jpg";
import greenHoodie from "../images/hoodies/hoodies_green.jpg";
import orangeHoodie from "../images/hoodies/hoodies_orange.jpg";
import pinkHoodie from "../images/hoodies/hoodies_pink.jpg";
import purpleHoodie from "../images/hoodies/hoodies_purple.jpg";
import whiteHoodie from "../images/hoodies/hoodies_white.jpg";

import blackLongsleeve from "../images/longsleeve/long_black.jpg";
import blueLongsleeve from "../images/longsleeve/long_blue.jpg";
import greenLongsleeve from "../images/longsleeve/long_green.jpg";
import yellowLongsleeve from "../images/longsleeve/long_yellow.jpg";

import placeholderImage from "../images/free-icon-browser-3585596.png";

const ClothingSelector = () => {
    const [selectedClothing, setSelectedClothing] = useState("tshirt");
    const [selectedSize, setSelectedSize] = useState("");
    const [selectedColor, setSelectedColor] = useState("black");
    const navigate = useNavigate();

    const clothingImages = {
        tshirt: { black: blackTShirt, blue: blueTShirt, gray: grayTShirt, green: greenTShirt, red: redTShirt },
        hoodies: { black: blackHoodie, brown: brownHoodie, green: greenHoodie, orange: orangeHoodie, pink: pinkHoodie, purple: purpleHoodie, white: whiteHoodie },
        longsleeve: { black: blackLongsleeve, blue: blueLongsleeve, green: greenLongsleeve, yellow: yellowLongsleeve }
    };

    const clothingColors = {
        tshirt: ["black", "blue", "gray", "green", "red"],
        hoodies: ["black", "brown", "green", "orange", "pink", "purple", "white"],
        longsleeve: ["black", "blue", "green", "yellow"]
    };

    const colorHex = {
        black: "#000000", blue: "#0000FF", brown: "#8B4513", gray: "#808080", green: "#008000",
        red: "#FF0000", orange: "#FFA500", pink: "#FFC0CB", purple: "#800080", yellow: "#FFFF00", white: "#FFFFFF"
    };

    const getClothingImage = () => clothingImages[selectedClothing]?.[selectedColor] || placeholderImage;

    useEffect(() => {
        setSelectedColor(clothingColors[selectedClothing]?.[0] || "black");
    }, [selectedClothing]);

    const handleConfirm = () => {
        if (selectedSize) {
            navigate("/embroidery", { state: { selectedClothing, selectedSize, selectedColor } });
        }
    };

    return (
        <div className="blockClothingSelector">
            <div className="clothing-block">
                <img src={getClothingImage()} alt={selectedClothing} className="clotheImage" />
                <div className="info-icon-wrapper">
                    <img src={infoIcon} alt="Info" className="info-icon" />
                    <div className="tooltip">Состав: 100% хлопок</div>
                </div>
            </div>

            {/* Выбор типа одежды */}
            <div className="blockSelection">
                <h1>Выберите изделие, цвет и размер</h1>
                <div className="selectorGroup">
                    <h3>Тип изделия:</h3>
                    <div className="selector">
                        {["tshirt", "hoodies", "longsleeve"].map((type) => (
                            <label key={type}>
                                <input type="radio" name="clothing" value={type} checked={selectedClothing === type} onChange={(e) => setSelectedClothing(e.target.value)} />
                                {type === "tshirt" ? "Футболка" : type === "hoodies" ? "Худи" : "Лонгслив"}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Выбор цвета */}
                <div className="selectorGroup">
                    <h3>Цвет:</h3>
                    <div className="colorSelector">
                        {clothingColors[selectedClothing]?.map((color) => (
                            <div
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                style={{
                                    width: "30px", height: "30px", borderRadius: "30%", backgroundColor: colorHex[color],
                                    cursor: "pointer", display: "inline-block", margin: "5px",
                                    boxShadow: selectedColor === color ? "0px 0px 10px rgba(0, 0, 0, 0.5)" : "none",
                                    transform: selectedColor === color ? "scale(1.1)" : "scale(1)"
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Выбор размера */}
                <div className="selectorGroup">
                    <h3>Размер:</h3>
                    <div className="selector">
                        {["S", "M", "L", "XL"].map((size) => (
                            <label key={size}>
                                <input type="radio" name="size" value={size} checked={selectedSize === size} onChange={(e) => setSelectedSize(e.target.value)} />
                                {size}
                            </label>
                        ))}
                    </div>
                </div>

                <button className="confirmButton" onClick={handleConfirm} disabled={!selectedSize}>Перейти к вышивке</button>
            </div>
        </div>
    );
};

export default ClothingSelector;
