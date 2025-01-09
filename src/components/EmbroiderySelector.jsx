import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const EmbroiderySelector = () => {
    const navigate = useNavigate();
    const [selectedType, setSelectedType] = useState(''); // Тип вышивки
    const [customText, setCustomText] = useState(''); // Текст для "Другая"
    const [uploadedImage, setUploadedImage] = useState(null); // Загрузка изображения
    const [comment, setComment] = useState(''); // Комментарий

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
            },
        });
    };

    // Определяем подписи для изображений на основе выбранного типа
    const getLabels = () => {
        if (selectedType === 'type1') {
            return ['Морда', 'Шерсть', 'Живот', 'Хвост'];
        } else if (selectedType === 'type2') {
            return ['Вид спереди', 'Вид слева', 'Вид сзади', 'Вид справа'];
        } else {
            return ['Вышивка 1', 'Вышивка 2', 'Вышивка 3', 'Вышивка 4'];
        }
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <h2>Выберите тип вышивки:</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
                {getLabels().map((title, index) => (
                    <div key={index} style={{ textAlign: 'center' }}>
                        <img
                            src={`https://via.placeholder.com/100?text=${title}`}
                            alt={title}
                            style={{ width: '100px', height: '100px', marginBottom: '10px' }}
                        />
                        <p>{title}</p>
                    </div>
                ))}
            </div>

            <div style={{ marginBottom: '20px' }}>
                <label>
                    <input
                        type="radio"
                        name="embroideryType"
                        value="type1"
                        onChange={(e) => setSelectedType(e.target.value)}
                        checked={selectedType === 'type1'}
                    />
                    Тип 1
                </label>
                <label style={{ marginLeft: '15px' }}>
                    <input
                        type="radio"
                        name="embroideryType"
                        value="type2"
                        onChange={(e) => setSelectedType(e.target.value)}
                        checked={selectedType === 'type2'}
                    />
                    Тип 2
                </label>
                <label style={{ marginLeft: '15px' }}>
                    <input
                        type="radio"
                        name="embroideryType"
                        value="type3"
                        onChange={(e) => setSelectedType(e.target.value)}
                        checked={selectedType === 'type3'}
                    />
                    Тип 3
                </label>
                <label style={{ marginLeft: '15px' }}>
                    <input
                        type="radio"
                        name="embroideryType"
                        value="custom"
                        onChange={(e) => setSelectedType(e.target.value)}
                        checked={selectedType === 'custom'}
                    />
                    Другая
                </label>
            </div>

            {selectedType === 'custom' && (
                <div style={{ marginBottom: '20px' }}>
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
                    Загрузите изображение:
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
                            height: '100px',
                        }}
                    />
                </label>
            </div>

            <button
                onClick={handleNext}
                style={{ padding: '10px 20px' }}
                disabled={!selectedType || (selectedType === 'custom' && !customText)} // Блокируем кнопку, если выбор не сделан
            >
                Данные о получателе
            </button>
        </div>
    );
};

export default EmbroiderySelector;
