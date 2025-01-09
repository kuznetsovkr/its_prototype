import React from 'react';
import { useLocation } from 'react-router-dom';

const RecipientDetails = () => {
    const location = useLocation();
    const { selectedType, customText, uploadedImage, comment } = location.state || {};

    return (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <h1>Данные о получателе</h1>
            <p><strong>Тип вышивки:</strong> {selectedType}</p>
            {selectedType === 'custom' && <p><strong>Текст для вышивки:</strong> {customText}</p>}
            {uploadedImage && <p><strong>Изображение:</strong> {uploadedImage.name}</p>}
            <p><strong>Комментарий:</strong> {comment}</p>
        </div>
    );
};

export default RecipientDetails;
