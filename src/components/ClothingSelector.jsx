import React, { useState,useEffect  } from 'react';
import { useNavigate } from 'react-router-dom';
import './ClothingSelector.css';
import infoIcon from '../images/free-icon-font-info-3916699.png';

import blackTShirt from '../images/t-shirts/t_shirt_black.jpg';
import blueTShirt from '../images/t-shirts/t_shirt_blue.jpg';
import grayTShirt from '../images/t-shirts/t_shirt_gray.jpg';
import greenTShirt from '../images/t-shirts/t_shirt_green.jpg';
import redTShirt from '../images/t-shirts/t_shirt_red.jpeg';

import blackHoodie from '../images/hoodies/hoodies_black.jpg';
import brownHoodie from '../images/hoodies/hoodies_brown.jpg';
import greenHoodie from '../images/hoodies/hoodies_green.jpg';
import orangeHoodie from '../images/hoodies/hoodies_orange.jpg';
import pinkHoodie from '../images/hoodies/hoodies_pink.jpg';
import purpleHoodie from '../images/hoodies/hoodies_purple.jpg';
import whiteHoodie from '../images/hoodies/hoodies_white.jpg';

import blackLongsleeve from '../images/longsleeve/long_black.jpg';
import blueLongsleeve from '../images/longsleeve/long_blue.jpg';
import greenLongsleeve from '../images/longsleeve/long_green.jpg';
import yellowLongsleeve from '../images/longsleeve/long_yellow.jpg';

import placeholderImage from '../images/free-icon-browser-3585596.png';




const ClothingSelector = () => {
    const [step, setStep] = useState(1); // 1 - выбор типа одежды, 2 - выбор размера
    const [selectedClothing, setSelectedClothing] = useState('tshirt'); // Тип одежды
    const [selectedSize, setSelectedSize] = useState(''); // Размер одежды
    const [selectedColor, setSelectedColor] = useState('black'); // Для цвета
    const navigate = useNavigate(); // Для навигации между страницами
   

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
            purple: purpleHoodie,
            white: whiteHoodie
        },
        longsleeve: {
            black: blackLongsleeve,
            blue: blueLongsleeve,
            green: greenLongsleeve,
            yellow: yellowLongsleeve
        }
    };

    const clothingColors = {
        tshirt: ['black', 'blue', 'gray', 'green','red'],
        hoodies: ['black', 'brown', 'green', 'orange', 'pink','purple','white'],
        longsleeve: ['black', 'blue', 'green', 'yellow']
    };

    const colorHex = {
        black: '#000000',
        blue: '#0000FF',
        brown: '#8B4513',
        gray: '#808080',
        green: '#008000',
        red: '#FF0000',
        orange: '#FFA500',
        pink: '#FFC0CB',   
        purple: '#800080', 
        yellow: '#FFFF00' , 
        white: '#FFFFFF',
        not_color: '#CCC'
    };

    const getClothingImage = () => {
        if (selectedColor === 'not_color') {
            return clothingImages[selectedClothing]?.black || placeholderImage;
        }
        return clothingImages[selectedClothing]?.[selectedColor] || placeholderImage;
    };

    // Устанавливаем первый доступный цвет при смене типа одежды
    useEffect(() => {
        if (clothingColors[selectedClothing]?.length > 0) {
            setSelectedColor(clothingColors[selectedClothing][0]); // Устанавливаем первый цвет из списка
        }
    }, [selectedClothing]);


    // Переход на следующий шаг
    const goToNextStep = () => {
        if (step === 2) {
            // Если текущий шаг - выбор размера, переходим на страницу подтверждения
            navigate('/embroidery', { state: { selectedClothing, selectedSize } });
        } else {
            setStep((prevStep) => prevStep + 1);
        }
    };

    // Переход на предыдущий шаг
    const goToPreviousStep = () => {
        if (step === 2) {
            setSelectedColor('black'); // Сбрасываем цвет на "цветной" при возврате на шаг 1
        }
        setStep((prevStep) => Math.max(prevStep - 1, 1));
    };

    return (
        <div className="blockClothingSelector">
            <div className="clothing-block">
                <img
                    src={getClothingImage()}
                    alt={selectedClothing}
                    className="clotheImage"
                />
                <div className="info-icon-wrapper">
                    <img
                        src={infoIcon}
                        alt="Info"
                        className="info-icon"
                    /> 
                    <div className="tooltip">
                        Состав: 100% хлопок
                    </div>
                </div>
            </div>
            
            {step === 1 && (
                <>
                    <div className="blockSpep1">
                        <h1>Выберите тип изделия:</h1>
                        <div className="selectorStep1">
                            <label>
                                <input
                                    type="radio"
                                    name="clothing"
                                    value="tshirt"
                                    checked={selectedClothing === 'tshirt'}
                                    onChange={(e) => setSelectedClothing(e.target.value)}
                                />
                                Футболка
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="clothing"
                                    value="hoodies"
                                    checked={selectedClothing === 'hoodies'}
                                    onChange={(e) => setSelectedClothing(e.target.value)}
                                />
                                Худи
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="clothing"
                                    value="longsleeve"
                                    checked={selectedClothing === 'longsleeve'}
                                    onChange={(e) => setSelectedClothing(e.target.value)}
                                />
                                Лонгслив
                            </label>
                        </div>
                        <button onClick={goToNextStep}>
                            Следующий шаг
                        </button>
                    </div>
                </>
            )}

            {step === 2 && (
                <>
                    <div className="blockSpep1">
                        <h1>Выберите размер и цвет:</h1>
                        <div className="selectorStep2">
                            <label>
                                <input
                                    type="radio"
                                    name="size"
                                    value="S"
                                    checked={selectedSize === 'S'}
                                    onChange={(e) => setSelectedSize(e.target.value)}
                                />
                                S
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="size"
                                    value="M"
                                    checked={selectedSize === 'M'}
                                    onChange={(e) => setSelectedSize(e.target.value)}
                                />
                                M
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="size"
                                    value="L"
                                    checked={selectedSize === 'L'}
                                    onChange={(e) => setSelectedSize(e.target.value)}
                                />
                                L
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="size"
                                    value="XL"
                                    checked={selectedSize === 'XL'}
                                    onChange={(e) => setSelectedSize(e.target.value)}
                                />
                                XL
                            </label>
                        </div>
                        <div className="colorSelectorStep2">
                            {clothingColors[selectedClothing]?.map((color) => (
                                <div
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    style={{
                                        width: '30px', // Увеличил немного размер для лучшей видимости эффекта
                                        height: '30px',
                                        borderRadius: '20%', // Сделал круги ровными
                                        backgroundColor: colorHex[color],
                                        cursor: 'pointer',
                                        display: 'inline-block',
                                        margin: '5px',
                                        transition: 'box-shadow 0.3s ease-in-out, transform 0.2s', // Плавное появление подсветки
                                        boxShadow: selectedColor === color 
                                            ? '0px 0px 10px rgba(0, 0, 0, 0.5)' // Добавляем свечение при выборе
                                            : '0px 0px 5px rgba(0, 0, 0, 0.2)', // Легкая тень для всех остальных
                                        transform: selectedColor === color ? 'scale(1.1)' : 'scale(1)', // Немного увеличиваем выбранный цвет
                                    }}
                                ></div>
                            ))}
                        </div>
                        <div className="buttonContainer">
                            <div className="sizeButton">
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        alert('Здесь будет размерная сетка'); // Замените на модальное окно или компонент
                                    }}
                                >
                                    Размерная сетка
                                </a>
                            </div>
                            <div className="stepButton">
                                <button onClick={goToPreviousStep}>
                                    Шаг назад
                                </button>
                                <button
                                    onClick={goToNextStep}
                                    disabled={!selectedSize || !selectedColor} // Блокируем кнопку, если размер не выбран
                                >
                                    Следующий шаг
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ClothingSelector;
