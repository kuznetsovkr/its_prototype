import checkIcon from "../../../images/Vector.svg";

const EmbroideryLegacy = ({ selection, navigate, textareaRef }) => {
  const {
    selectedType, customText, setCustomText, uploadedImage, setUploadedImage,
    comment, setComment, error, patronusCount, setPatronusCount,
    petFaceCount, setPetFaceCount, customOption, setCustomOption,
    customTextFont, setCustomTextFont, patronusLimit, patronusLimitText,
    canProceed, disabledHint, priceError, priceLabel, customPriceNote,
    handleSelectType, handleFileChange, handleRemoveImage,
  } = selection;
  const handleNext = () => {
    if (canProceed) navigate("/recipient");
  };

  return (
      <div className="containerExampleType embroiderySelector__legacy">
      <div className="exampleImg"></div>

      <div className="containterType">
        <div className="selectorGroup">
            <p className="title">ВЫБЕРИТЕ ТИП ВЫШИВКИ</p>
          <div className="selector">
            <label className="selector__item">
              <input
                type="radio"
                name="embroideryType"
                value="Patronus"
                onChange={(e) => handleSelectType(e.target.value)}
                checked={selectedType === "Patronus"}
              />
              <span className="selector__custom">
                <img src={checkIcon} className="selector__check" alt="" aria-hidden="true" />
              </span>
              патронусы
              <span className="selector__price">{priceLabel("Patronus")}</span>
            </label>

            {selectedType === "Patronus" && (
              <div className="patronusCounter">
                <button
                  className="circleButton"
                  onClick={() => setPatronusCount((prev) => Math.max(1, prev - 1))}
                >
                    -
                </button>
                <span className="countValue">{patronusCount}</span>
                <button
                  className="circleButton"
                  onClick={() => setPatronusCount((prev) => Math.min(patronusLimit, prev + 1))}
                  disabled={patronusCount >= patronusLimit}
                >
                  +
                </button>
                <span className="limitText">*{patronusLimitText}</span>
              </div>
            )}

            <label className="selector__item">
              <input
                type="radio"
                name="embroideryType"
                value="Car"
                onChange={(e) => handleSelectType(e.target.value)}
                checked={selectedType === "Car"}
              />
              <span className="selector__custom">
                <img src={checkIcon} className="selector__check" alt="" aria-hidden="true" />
              </span>
              автомобиль
              <span className="selector__price">{priceLabel("Car")}</span>
            </label>

            <label className="selector__item">
              <input
                type="radio"
                name="embroideryType"
                value="petFace"
                onChange={(e) => handleSelectType(e.target.value)}
                checked={selectedType === "petFace"}
              />
              <span className="selector__custom">
                <img src={checkIcon} className="selector__check" alt="" aria-hidden="true" />
              </span>
              вышивка мордочки питомца по фото
              <span className="selector__price">{priceLabel("petFace")}</span>
            </label>

            {selectedType === "petFace" && (
              <div className="patronusCounter">
                <button
                  className="circleButton"
                  onClick={() => setPetFaceCount((prev) => Math.max(1, prev - 1))}
                >
                  –
                </button>
                <span className="countValue">{petFaceCount}</span>
                <button
                  className="circleButton"
                  onClick={() => setPetFaceCount((prev) => Math.min(5, prev + 1))}
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
                value="custom"
                onChange={(e) => handleSelectType(e.target.value)}
                checked={selectedType === "custom"}
              />
              <span className="selector__custom">
                <img src={checkIcon} className="selector__check" alt="" aria-hidden="true" />
              </span>
              другая
              <span className="selector__price">{customPriceNote}</span>
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
                    name="customChoice"
                    checked={customOption.image}
                    onChange={() => {
                      setCustomOption({ image: true, text: false });
                      setCustomText("");
                    }}
                  />
                  <span className="selector__custom">
                    <img src={checkIcon} className="selector__check" alt="" aria-hidden="true" />
                  </span>
                  изображение
                </label>

                <label className="selector__item" style={{ marginBottom: "10px" }}>
                  <input
                    type="radio"
                    name="customChoice"
                    checked={customOption.text}
                    onChange={() => {
                      setCustomOption({ image: false, text: true });
                      setUploadedImage([]);
                    }}
                  />
                  <span className="selector__custom">
                    <img src={checkIcon} className="selector__check" alt="" aria-hidden="true" />
                  </span>
                  надпись
                </label>
              </div>
            </div>
          )}

          {(selectedType !== "custom" || customOption.image) && (
            <>
              <div className="fileInputWrapper">
                <span className="fileLimitNote">*не более {selectedType === "petFace" ? 5 : 10} файлов</span>

                <label className="customFileButton">
                  Выберите файлы
                  <input
                    className="hiddenFileInput"
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              <ul className="file-list">
                {uploadedImage.map((file, index) => (
                  <li key={file.name + index} className="file-item">
                    <span className="file-name" title={file.name}>{file.name}</span>
                    <button
                      type="button"
                      className="icon-btn close-btn"
                      aria-label={`Удалить ${file.name}`}
                      onClick={() => handleRemoveImage(index)}
                    >
                      &times;
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {selectedType === "custom" && customOption.text && (
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
                <select value={customTextFont} onChange={(e) => setCustomTextFont(e.target.value)}>
                  <option value="Arial">Arial</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Comic Sans MS">Comic Sans MS</option>
                </select>
              </div>
            </>
          )}

          {(error || priceError) && <p style={{ color: "red" }}>{error || priceError}</p>}
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
          <button
            className="confirmButton"
            onClick={handleNext}
            disabled={!canProceed}
            title={!canProceed ? disabledHint : undefined}
          >
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

export default EmbroideryLegacy;
