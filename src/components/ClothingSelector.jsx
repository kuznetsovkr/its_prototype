import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ClothingSelector.css';
import tshirtImage from '../images/free-icon-t-shirt-2634593.png'; // Укажите путь к изображению футболки
import sweaterImage from '../images/free-icon-hoodie-5638935.png'; // Укажите путь к изображению кофты
import infoIcon from '../images/free-icon-font-info-3916699.png';
import whiteTShirt from '../images/free-icon-t-shirt-2634728.png';
import whiteHoodie from '../images/free-icon-hoodie-5638907.png'; 

const ClothingSelector = () => {
    const [step, setStep] = useState(1); // 1 - выбор типа одежды, 2 - выбор размера
    const [selectedClothing, setSelectedClothing] = useState('tshirt'); // Тип одежды
    const [selectedSize, setSelectedSize] = useState(''); // Размер одежды
    const [selectedColor, setSelectedColor] = useState(''); // Для цвета
    const navigate = useNavigate(); // Для навигации между страницами

    // Определяем изображение на основе выбранного типа одежды
    const getClothingImage = () => {
        // Сначала проверяем, если выбран "не цветной" вариант
        if (selectedColor === 'not_color') {
            return selectedClothing === 'tshirt'
                ? whiteTShirt // Картинка белой футболки
                : whiteHoodie; // Картинка белого худи
        }

        // Затем проверяем выбранное изделие
        if (selectedClothing === 'tshirt') {
            return tshirtImage; // Цветная футболка
        } else if (selectedClothing === 'sweater') {
            return sweaterImage; // Цветное худи
        }

        // Заглушка по умолчанию (например, если ничего не выбрано)
        return 'https://via.placeholder.com/300?text=Select+Clothing';
    };


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
            setSelectedColor('color'); // Сбрасываем цвет на "цветной" при возврате на шаг 1
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
                                    value="sweater"
                                    checked={selectedClothing === 'sweater'}
                                    onChange={(e) => setSelectedClothing(e.target.value)}
                                />
                                Худи
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
                        </div>
                        <div className="colorSelectorStep2">
                            {['color', 'not_color'].map((color) => (
                                <div
                                    key={color}
                                    onClick={() => setSelectedColor(color)} // Обновляем выбранный цвет
                                    style={{
                                        width: '15px',
                                        height: '15px',
                                        borderRadius: '50%',
                                        backgroundColor: color === 'color' ? '#FF5733' : '#CCC',
                                        cursor: 'pointer',
                                        border: selectedColor === color ? '2px solid black' : '1px solid #999', // Выделяем выбранный кружок
                                    }}
                                ></div>
                            ))}
                        </div>
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                alert('Здесь будет размерная сетка'); // Замените на модальное окно или компонент
                            }}
                            style={{ display: 'block', marginTop: '10px', color: 'blue', textDecoration: 'underline' }}
                        >
                            Размерная сетка
                        </a>
                        <div className="buttonContainer"> 
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
                </>
            )}
        </div>
    );
};

export default ClothingSelector;
