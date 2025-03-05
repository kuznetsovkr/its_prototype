import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import face from "../images/embroidery/face.png";
import hvost from "../images/embroidery/hvost.png";
import sherst from "../images/embroidery/sherst.png";
import car1 from "../images/embroidery/cars1.png";

const MAX_FILES = 10; // Максимальное число файлов
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif"]; // Разрешённые форматы

const EmbroiderySelector = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedType, setSelectedType] = useState("Patronus");
  const [customText, setCustomText] = useState("");
  const [uploadedImage, setUploadedImage] = useState([]); // Массив загруженных изображений
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const { selectedClothing, selectedSize, selectedColor } = location.state || {};

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    let validFiles = [];

    // Проверяем файлы
    for (let file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Допустимы только изображения (JPG, PNG, GIF).");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`Файл "${file.name}" превышает 2MB.`);
        return;
      }
      validFiles.push(file);
    }

    if (uploadedImage.length + validFiles.length > MAX_FILES) {
      setError(`Можно загрузить не более ${MAX_FILES} изображений.`);
      return;
    }

    setUploadedImage([...uploadedImage, ...validFiles]);
    setError("");
  };

  const handleRemoveImage = (index) => {
    setUploadedImage(uploadedImage.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    const uploadedPaths = uploadedImage.map(file => file.url); // Берём только URL
    navigate("/recipient", {
      state: {
        selectedType,
        customText,
        uploadedImage: uploadedPaths,
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
              <img src={imgSrc} alt={`Пример ${index + 1}`} />
              <p>Пример {index + 1}</p>
            </div>
          ))}
        </div>

        {/* Блок с выбором типа вышивки */}
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

          {/* Загрузка изображений */}
          <div className="uploadBlock">
            <label>
              Загрузите изображения (до 10 файлов, не более 2MB каждый):
              <input type="file" multiple onChange={handleFileChange} />
            </label>
            {error && <p style={{ color: "red" }}>{error}</p>}

            <div className="image-preview">
              {uploadedImage.map((file, index) => (
                <div key={index} className="image-thumbnail">
                  <img src={URL.createObjectURL(file)} alt={`Фото ${index + 1}`} width="80" />
                  <button onClick={() => handleRemoveImage(index)}>Удалить</button>
                </div>
              ))}
            </div>
          </div>

          {/* Комментарий */}
          <div className="commentBlock">
            <label>
              Комментарий:
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} />
            </label>
          </div>

          <button className="stepButton" onClick={handleNext} disabled={!selectedType}>
            Перейти к оформлению
          </button>
        </div>
      </div>

      {/* Поле для ввода текста, если выбрана "Другая" */}
      {selectedType === "custom" && (
        <div className="customTextBlock">
          <label>
            Введите текст:
            <input type="text" value={customText} onChange={(e) => setCustomText(e.target.value)} />
          </label>
        </div>
      )}
    </div>
  );
};

export default EmbroiderySelector;
