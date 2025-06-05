import { useState,useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ReactComponent as CheckIcon } from '../images/Vector.svg'

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
    Patronus: [],
    Car: [],
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

        </div>

        {/* Блок с выбором типа вышивки */}
        <div className="containterType">
          <div className="selectorGroup">
            <p className="title">ВЫБЕРИТЕ ТИП ВЫШИВКИ</p>
            <div className="selector">
              <label className="selector__item">
                <input
                  type="radio"
                  name="embroideryType"
                  value="Patronus"
                  onChange={(e) => setSelectedType(e.target.value)}
                  checked={selectedType === "Patronus"}
                />
                <span className="selector__custom">
                    <CheckIcon className="selector__check" />
                </span>
                патронусы
              </label>

              <label className="selector__item">
                <input
                  type="radio"
                  name="embroideryType"
                  value="Car"
                  onChange={(e) => setSelectedType(e.target.value)}
                  checked={selectedType === "Car"}
                />
                <span className="selector__custom">
                    <CheckIcon className="selector__check" />
                </span>
                автомобиль
              </label>

              <label className="selector__item">
                <input
                  type="radio"
                  name="embroideryType"
                  value="petFace"
                  onChange={(e) => setSelectedType(e.target.value)}
                  checked={selectedType === "petFace"}
                />
                <span className="selector__custom">
                    <CheckIcon className="selector__check" />
                </span>
                вышивка мордочки питомца по фото
              </label>

              <label className="selector__item">
                <input
                  type="radio"
                  name="embroideryType"
                  value="custom"
                  onChange={(e) => setSelectedType(e.target.value)}
                  checked={selectedType === "custom"}
                />
                <span className="selector__custom">
                    <CheckIcon className="selector__check" />
                </span>
                другая
              </label>
            </div>
          </div>


          <div className="uploadBlock">
            <p className="title">ЗАГРУЗИТЕ ИЗОБРАЖЕНИЕ</p>
            <label>
              <input className="loadButton" type="file" multiple accept="image/*" onChange={handleFileChange} />
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
            <p className="title">КОММЕНТАРИЙ:</p>
            <label>
              <textarea 
                ref={textareaRef}
                className="autoTextarea"
                value={comment} 
                onChange={(e) => setComment(e.target.value)} 
                placeholder="Напишите ваши пожелания, которые учтут наши дизайнеры"/>
            </label>
          </div>

          <button className="confirmButton" onClick={handleNext} disabled={!selectedType}>
            ПЕРЕЙТИ К ОФОРМЛЕНИЮ
          </button>
        </div>
      </div>    
  );
};

export default EmbroiderySelector;
