import React, { useState } from 'react';
import { useNavigate,useLocation  } from 'react-router-dom';
import './EmbroiderySelector.css';

import face from '../images/embroidery/face.png';
import hvost from '../images/embroidery/hvost.png';
import sherst from '../images/embroidery/sherst.png';

import car1 from '../images/embroidery/cars1.png';


const EmbroiderySelector = () => {
    const navigate = useNavigate();
    const [selectedType, setSelectedType] = useState('Patronus');
    const [customText, setCustomText] = useState(''); // Текст для "Другая"
    const [uploadedImage, setUploadedImage] = useState(null); // Загрузка изображения
    const [comment, setComment] = useState(''); // Комментарий
    const location = useLocation();
    const { selectedClothing, selectedSize, selectedColor } = location.state || {}; // Если данных нет, будет `undefined`


    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setUploadedImage(file);
    };

    const handleNext = () => {
        // Переход на страницу "Данные о получателе"
        navigate('/recipient', {
            state: {
                selectedType,
                customText,
                uploadedImage,
                comment,
                productType: selectedClothing, // ✅ Добавлено
                size: selectedSize,            // ✅ Добавлено
                color: selectedColor,          // ✅ Добавлено
            },
        });
    };

    // Определяем подписи для изображений на основе выбранного типа
    const getLabels = () => {
        if (selectedType === 'Patronus') {
            return ['Морда', 'Шерсть', 'Живот', 'Хвост'];
        } else if (selectedType === 'Car') {
            return ['Вид спереди', 'Вид слева', 'Вид сзади', 'Вид справа'];
        } else {
            return ['Вышивка 1', 'Вышивка 2', 'Вышивка 3', 'Вышивка 4'];
        }
    };

    const embroideryImages = {
        Patronus: [face, hvost, sherst], // Патронусы
        Car: [car1], // Машины
    };


    return (
        <div className="blockEmbroiderySelector">
            <h2>Детали вышивки</h2>
            <div className="containerExampleType">
                <div className="exampleImg">
                    {embroideryImages[selectedType]?.map((imgSrc, index) => (
                        <div key={index} className="image-container">
                            <img src={imgSrc} alt={`Изображение ${index + 1}`} />
                            <p>Пример {index + 1}</p>
                        </div>
                    ))}
                </div>


                <div className="selectorType">
                    <label>
                        <input
                            type="radio"
                            name="embroideryType"
                            value="Patronus"
                            onChange={(e) => setSelectedType(e.target.value)}
                            checked={selectedType === 'Patronus'}
                        />
                        Патронусы
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="embroideryType"
                            value="Car"
                            onChange={(e) => setSelectedType(e.target.value)}
                            checked={selectedType === 'Car'}
                        />
                        Машина
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="embroideryType"
                            value="custom"
                            onChange={(e) => setSelectedType(e.target.value)}
                            checked={selectedType === 'custom'}
                        />
                        Другая
                    </label>
                    <button 
                        className="stepButton"
                        onClick={handleNext}
                        disabled={!selectedType || (selectedType === 'custom' && !customText)} // Блокируем кнопку, если выбор не сделан
                    >
                        Данные о получателе
                    </button>
                </div>
            </div>

            {selectedType === 'custom' && (
                <div>
                    <label>
                        Введите текст:
                        <input
                            type="text"
                            value={customText}
                            onChange={(e) => setCustomText(e.target.value)}
                            style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
                        />
                    </label>
                </div>
            )}

            <div style={{ marginBottom: '20px' }}>
                <label>
                    Загрузите изображения по шаблону выше:
                    <input type="file" onChange={handleFileChange} style={{ marginLeft: '10px' }} />
                </label>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <label>
                    Комментарий:
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        style={{
                            display: 'block',
                            marginTop: '10px',
                            padding: '10px',
                            width: '300px',
                            height: '50px',
                        }}
                    />
                </label>
            </div>
        </div>
    );
};

export default EmbroiderySelector;
