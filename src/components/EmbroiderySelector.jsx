import React, { useState,useRef, useEffect } from "react";
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
    const files = Array.from(e.target.files).slice(0, 10);

    setUploadedImage(files);
  };

  const handleRemoveImage = (index) => {
    setUploadedImage(uploadedImage.filter((_, i) => i !== index));
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
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [comment]);

  return (
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
          <div className="selectorGroup">
            <p className="title">Выберите тип вышивки</p>
            <div className="selector">
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
            </div>
          </div>


          <div className="uploadBlock">
            <p className="title">Загрузите изображения</p>
            <label>
              <input type="file" multiple accept="image/*" onChange={handleFileChange} />
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

          <div className="commentBlock">
            <p className="title">Комментарий:</p>
            <label>
              <textarea 
                ref={textareaRef}
                className="autoTextarea"
                value={comment} 
                onChange={(e) => setComment(e.target.value)} 
                placeholder="Введите ваши пожелания, которые учтут наши дизайнеры"/>
            </label>
          </div>

          <button className="confirmButton" onClick={handleNext} disabled={!selectedType}>
            Перейти к оформлению
          </button>
        </div>
      </div>    
  );
};

export default EmbroiderySelector;
