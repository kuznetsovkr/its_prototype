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
  const [patronusCount, setPatronusCount] = useState(1);
  const [customOption, setCustomOption] = useState({
    image: false,
    text: false,
  });
  const [customTextFont, setCustomTextFont] = useState("Arial");


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

  useEffect(() => {
    if (selectedType !== "custom") {
      setCustomOption({ image: false, text: false });
      setCustomText("");
      setCustomTextFont("Arial");
    }
  }, [selectedType]);

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
              
              {selectedType === "Patronus" && (
                <div className="patronusCounter">
                  <button
                    className="circleButton"
                    onClick={() => setPatronusCount((prev) => Math.max(1, prev - 1))}
                  >
                    −
                  </button>
                  <span className="countValue">{patronusCount}</span>
                  <button
                    className="circleButton"
                    onClick={() => setPatronusCount((prev) => Math.min(5, prev + 1))}
                  >
                    +
                  </button>
                  <span className="limitText">*не более 5</span>
                </div>
              )}


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
            <p className="title">
              {selectedType === "custom" ? "ВЫБЕРИТЕ ПРИНТ" : "ЗАГРУЗИТЕ ИЗОБРАЖЕНИЕ"}
            </p>

            {selectedType === "custom" && (
              <div className="selectorGroup">
                <div className="selector">
                  <label className="selector__item">
                    <input
                      type="radio"
                      name="embroideryType"
                      checked={customOption.image}
                      onChange={(e) =>
                        setCustomOption((prev) => ({ ...prev, image: e.target.checked }))
                      }
                    />
                    <span className="selector__custom">
                      <CheckIcon className="selector__check" />
                    </span>
                    изображение
                  </label>

                  <label className="selector__item" style={{ marginBottom: '10px' }}>
                    <input
                      type="checkbox"
                      checked={customOption.text}
                      onChange={(e) =>
                        setCustomOption((prev) => ({ ...prev, text: e.target.checked }))
                      }
                    />
                    <span className="selector__custom">
                      <CheckIcon className="selector__check" />
                    </span>
                    надпись
                  </label>
                </div>
              </div>
            )}

            {/* Загрузка изображений — показываем, если выбран не custom, или выбрана опция image */}
            {(selectedType !== "custom" || customOption.image) && (
              <>
                <div className="fileInputWrapper">
                  <span className="fileLimitNote">
                    *не более {selectedType === "petFace" ? 5 : 10} файлов
                  </span>

                  <label className="customFileButton">
                    Выберите файлы
                    <input
                      className="hiddenFileInput"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>

                <div className="image-preview">
                  {uploadedImage.map((file, index) => (
                    <div key={index} className="image-thumbnail">
                      <img src={URL.createObjectURL(file)} alt={`Фото ${index + 1}`} width="80" />
                      <button onClick={() => handleRemoveImage(index)}>Удалить</button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Текстовая надпись при выборе "надпись" */}
            {customOption.text && (
              <>
                <div className="customTextBlock">
                  <p className="title">ТЕКСТ ДЛЯ ВЫШИВКИ:</p>
                  <textarea
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Введите надпись"
                    style={{ fontFamily: customTextFont }}
                  />
                </div>

                <div className="fontSelectBlock">
                  <p className="title">ВЫБЕРИТЕ ШРИФТ:</p>
                  <select
                    value={customTextFont}
                    onChange={(e) => setCustomTextFont(e.target.value)}
                  >
                    <option value="Arial">Arial</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Comic Sans MS">Comic Sans MS</option>
                  </select>
                </div>
              </>
            )}

            {error && <p style={{ color: "red" }}>{error}</p>}
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

          <div className="navigationButtons">
            <button className="confirmButton" onClick={handleNext} disabled={!selectedType}>
              ПЕРЕЙТИ К ОФОРМЛЕНИЮ
            </button>

            <button className="backButton" onClick={() => navigate(-1)}>
              вернуться назад
            </button>
          </div>

        </div>
      </div>    
  );
};

export default EmbroiderySelector;
