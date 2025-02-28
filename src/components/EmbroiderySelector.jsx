import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import face from "../images/embroidery/face.png";
import hvost from "../images/embroidery/hvost.png";
import sherst from "../images/embroidery/sherst.png";
import car1 from "../images/embroidery/cars1.png";


const EmbroiderySelector = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedType, setSelectedType] = useState("Patronus");
  const [customText, setCustomText] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [comment, setComment] = useState("");

  const { selectedClothing, selectedSize, selectedColor } = location.state || {};

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setUploadedImage(file);
  };

  const handleNext = () => {
    navigate("/recipient", {
      state: {
        selectedType,
        customText,
        uploadedImage,
        comment,
        productType: selectedClothing,
        size: selectedSize,
        color: selectedColor,
      },
    });
  };

  const embroideryImages = {
    Patronus: [face, hvost, sherst], 
    Car: [car1], 
  };

  return (
    <div className="blockEmbroiderySelector">
      <h2>Детали вышивки</h2>

      <div className="containerExampleType">
        {/* Блок с примерами изображений */}
        <div className="exampleImg">
          {embroideryImages[selectedType]?.map((imgSrc, index) => (
            <div key={index} className="image-container">
              <img src={imgSrc} alt={`Изображение ${index + 1}`} />
              <p>Пример {index + 1}</p>
            </div>
          ))}
        </div>

        {/* Блок с радио-кнопками + кнопка перехода */}
        <div className="selectorType">
          <label>
            <input
              type="radio"
              name="embroideryType"
              value="Patronus"
              onChange={(e) => setSelectedType(e.target.value)}
              checked={selectedType === "Patronus"}
            />
            Патронусы
          </label>

          <label>
            <input
              type="radio"
              name="embroideryType"
              value="Car"
              onChange={(e) => setSelectedType(e.target.value)}
              checked={selectedType === "Car"}
            />
            Машина
          </label>

          <label>
            <input
              type="radio"
              name="embroideryType"
              value="custom"
              onChange={(e) => setSelectedType(e.target.value)}
              checked={selectedType === "custom"}
            />
            Другая
          </label>

          <button
            className="stepButton"
            onClick={handleNext}
            disabled={
              !selectedType || (selectedType === "custom" && !customText)
            }
          >
            Данные о получателе
          </button>
        </div>
      </div>

      {/* Поле для ввода текста, если выбрана "Другая" */}
      {selectedType === "custom" && (
        <div className="customTextBlock">
          <label>
            Введите текст:
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
            />
          </label>
        </div>
      )}

      {/* Загрузка изображения */}
      <div className="uploadBlock">
        <label>
          Загрузите изображения по шаблону выше:
          <input type="file" onChange={handleFileChange} />
        </label>
      </div>

      {/* Комментарий */}
      <div className="commentBlock">
        <label>
          Комментарий:
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
};

export default EmbroiderySelector;
