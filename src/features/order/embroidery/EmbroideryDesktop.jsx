import React from "react";
import figmaTshirtImg from "../../../images/order/tshirt-black.png";
import embroideryRadioActive from "../../../images/order/embroidery-radio-active.svg";
import embroideryRadioActiveMobile from "../../../images/order/embroidery-radio-active-mobile.svg";
import embroideryRadioActiveTablet from "../../../images/order/embroidery-radio-active-tablet.svg";
import embroideryRadioInactive from "../../../images/order/embroidery-radio-inactive.svg";
import embroideryRadioInactiveMobile from "../../../images/order/embroidery-radio-inactive-mobile.svg";
import embroideryRadioInactiveTablet from "../../../images/order/embroidery-radio-inactive-tablet.svg";
import embroideryCounter from "../../../images/order/embroidery-counter.svg";
import embroideryCounterMobile from "../../../images/order/embroidery-counter-mobile.svg";
import embroideryCounterTablet from "../../../images/order/embroidery-counter-tablet.svg";
import orderBackIcon from "../../../images/order/order-back.svg";
import orderBackIconMobile from "../../../images/order/order-back-mobile.svg";
import orderBackIconTablet from "../../../images/order/order-back-tablet.svg";
import {
  EMBROIDERY_TYPES as desktopEmbroideryTypes,
  MAX_UPLOAD_MB as MAX_MB,
  UPLOAD_INSTRUCTIONS as uploadInstructions,
} from "./embroideryConfig";

const EmbroideryDesktop = ({
  selection,
  desktopTab,
  desktopDetailsOpen,
  isUploadStage,
  fileInputRef,
  onImageTab: handleDesktopImageTab,
  onTextTab: handleDesktopTextTab,
  onTypeSelect: handleDesktopType,
  onBack: handleDesktopBack,
  onNext: handleDesktopNext,
}) => {
  const {
    selectedType, customText, setCustomText, uploadedImage, comment, setComment,
    error, patronusCount, setPatronusCount, petFaceCount, setPetFaceCount,
    customTextFont, setCustomTextFont, patronusLimit, hasFiles,
    canProceed, disabledHint, priceError, desktopPriceLabel, handleFileChange,
    handleFileDragOver, handleFileDrop, handleRemoveImage,
  } = selection;

  const renderDesktopCounter = (value, setValue, limit) => (
    <div className="embroideryDesktopCounter">
      <button type="button" className="embroideryDesktopCounter__button" onClick={() => setValue((current) => Math.max(1, current - 1))} aria-label="Уменьшить количество">
        <picture className="embroideryDesktopCounter__icon">
          <source media="(max-width: 639px)" srcSet={embroideryCounterMobile} />
          <source media="(max-width: 1279px)" srcSet={embroideryCounterTablet} />
          <img src={embroideryCounter} alt="" aria-hidden="true" />
        </picture>
        <span>−</span>
      </button>
      <span className="embroideryDesktopCounter__value">{value} шт</span>
      <button type="button" className="embroideryDesktopCounter__button" onClick={() => setValue((current) => Math.min(limit, current + 1))} aria-label="Увеличить количество">
        <picture className="embroideryDesktopCounter__icon">
          <source media="(max-width: 639px)" srcSet={embroideryCounterMobile} />
          <source media="(max-width: 1279px)" srcSet={embroideryCounterTablet} />
          <img src={embroideryCounter} alt="" aria-hidden="true" />
        </picture>
        <span>+</span>
      </button>
      <span className="embroideryDesktopCounter__limit">( не более {limit} шт )</span>
    </div>
  );

  return (
      <div
        className={`embroiderySelectorDesktop${isUploadStage ? " embroiderySelectorDesktop--upload" : ""}`}
      >
        <div
          className="embroiderySelectorDesktop__preview"
          onDragOver={isUploadStage ? handleFileDragOver : undefined}
          onDrop={isUploadStage ? handleFileDrop : undefined}
        >
          <button
            type="button"
            className="embroiderySelectorDesktop__arrow"
            onClick={handleDesktopBack}
            aria-label="Вернуться назад"
          >
            <picture className="embroiderySelectorDesktop__arrowIcon">
              <source media="(max-width: 639px)" srcSet={orderBackIconMobile} />
              <source media="(max-width: 1279px)" srcSet={orderBackIconTablet} />
              <img src={orderBackIcon} alt="" aria-hidden="true" />
            </picture>
          </button>

          <h1 className="embroiderySelectorDesktop__title" id="order-embroidery-title">
            заказ изделия
          </h1>

          <div className="embroiderySelectorDesktop__imageFrame">
            <img src={figmaTshirtImg} alt="Чёрная футболка" />
          </div>
        </div>

        <div className="embroiderySelectorDesktop__controls">
          <section className="embroiderySelectorDesktop__panel">
            <h2>{isUploadStage ? "Загрузите ваше изображение" : "Выберите тип вышивки"}</h2>

            {!isUploadStage && (
              <div className="embroideryDesktopTabs" aria-label="Вид вышивки">
                <button
                  type="button"
                  className={desktopTab === "image" ? "is-active" : ""}
                  onClick={handleDesktopImageTab}
                  aria-pressed={desktopTab === "image"}
                >
                  изображение
                </button>
                <button
                  type="button"
                  className={desktopTab === "text" ? "is-active" : ""}
                  onClick={handleDesktopTextTab}
                  aria-pressed={desktopTab === "text"}
                >
                  надпись
                </button>
              </div>
            )}

            {desktopTab === "image" && !desktopDetailsOpen && (
              <div className="embroideryDesktopChoices">
                {desktopEmbroideryTypes.map((option) => (
                  <React.Fragment key={option.value}>
                    <label className="embroideryDesktopChoice">
                      <input
                        type="radio"
                        name="embroideryTypeDesktop"
                        value={option.value}
                        checked={selectedType === option.value}
                        onChange={(event) => handleDesktopType(event.target.value)}
                      />
                      <picture className="embroideryDesktopChoice__radio">
                        <source
                          media="(max-width: 639px)"
                          srcSet={selectedType === option.value
                            ? embroideryRadioActiveMobile
                            : embroideryRadioInactiveMobile}
                        />
                        <source
                          media="(max-width: 1279px)"
                          srcSet={selectedType === option.value
                            ? embroideryRadioActiveTablet
                            : embroideryRadioInactiveTablet}
                        />
                        <img
                          src={selectedType === option.value
                            ? embroideryRadioActive
                            : embroideryRadioInactive}
                          alt=""
                          aria-hidden="true"
                        />
                      </picture>
                      <span className="embroideryDesktopChoice__label">{option.label}</span>
                      {option.hasExample && (
                        <span className="embroideryDesktopChoice__example">пример работы</span>
                      )}
                      {option.value === "custom" && (
                        <span className="embroideryDesktopChoice__note">
                          ( стоимость рассчитает менеджер )
                        </span>
                      )}
                    </label>

                    {option.value === "Patronus" && selectedType === "Patronus" &&
                      renderDesktopCounter(patronusCount, setPatronusCount, patronusLimit)}
                    {option.value === "petFace" && selectedType === "petFace" &&
                      renderDesktopCounter(petFaceCount, setPetFaceCount, 5)}
                  </React.Fragment>
                ))}
              </div>
            )}

            {desktopTab === "image" && desktopDetailsOpen && (
              <div
                className="embroideryUploadStage"
                onDragOver={handleFileDragOver}
                onDrop={handleFileDrop}
              >
                <div
                  className={`embroideryUploadStage__instructions${hasFiles || error ? " is-status" : ""}`}
                >
                  {hasFiles || error ? (
                    <div className="embroideryUploadStage__status">
                      {hasFiles && (
                        <>
                          <p className="embroideryUploadStage__summary">
                            Загружено файлов: {uploadedImage.length}
                          </p>
                          <ul className="embroideryUploadStage__files">
                            {uploadedImage.map((file, index) => (
                              <li key={`${file.name}_${file.size}_${file.lastModified}`}>
                                <span title={file.name}>{file.name}</span>
                                <button
                                  type="button"
                                  aria-label={`Удалить ${file.name}`}
                                  onClick={() => handleRemoveImage(index)}
                                >
                                  ×
                                </button>
                              </li>
                            ))}
                          </ul>
                          <label className="embroideryUploadStage__comment">
                            <span className="embroideryUploadStage__commentLabel">Комментарий</span>
                            <textarea
                              value={comment}
                              onChange={(event) => setComment(event.target.value)}
                              placeholder="Пожелания для дизайнера"
                            />
                          </label>
                        </>
                      )}
                      {error && (
                        <p className="embroideryUploadStage__error" role="status" aria-live="polite">
                          {error}
                        </p>
                      )}
                    </div>
                  ) : (
                    uploadInstructions.map((instruction) => (
                      <p key={instruction}>{instruction}</p>
                    ))
                  )}
                </div>

                <label className="embroideryUploadStage__upload">
                  загрузите изображение
                  <input
                    ref={fileInputRef}
                    className="embroideryUploadStage__fileInput"
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    aria-describedby="embroidery-upload-rules"
                    onChange={handleFileChange}
                  />
                </label>

                <button
                  type="button"
                  className="embroideryUploadStage__dropzone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Загрузите фото или перетащите файл на область визуализации слева
                </button>

                <p className="embroideryUploadStage__rules" id="embroidery-upload-rules">
                  PNG, JPG или WebP до {MAX_MB} МБ, не более {selectedType === "petFace" ? 5 : 10} файлов
                </p>
              </div>
            )}

            {desktopTab === "text" && (
              <div className="embroideryDesktopDetails embroideryDesktopDetails--text">
                <label className="embroideryDesktopDetails__field">
                  <span>Текст для вышивки</span>
                  <textarea
                    value={customText}
                    onChange={(event) => setCustomText(event.target.value)}
                    placeholder="Введите надпись"
                    style={{ fontFamily: customTextFont }}
                  />
                </label>

                <label className="embroideryDesktopDetails__field">
                  <span>Шрифт</span>
                  <select
                    value={customTextFont}
                    onChange={(event) => setCustomTextFont(event.target.value)}
                  >
                    <option value="Arial">Arial</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Comic Sans MS">Comic Sans MS</option>
                  </select>
                </label>

                <label className="embroideryDesktopDetails__field">
                  <span>Комментарий</span>
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Пожелания для дизайнера"
                  />
                </label>
              </div>
            )}

            <p className="embroiderySelectorDesktop__price">{desktopPriceLabel}</p>
            {priceError && <p className="embroideryUploadStage__error" role="alert">{priceError}</p>}
          </section>

          <div className="embroiderySelectorDesktop__navigation">
            <button type="button" className="is-back" onClick={handleDesktopBack}>
              назад
            </button>
            <button
              type="button"
              className="is-next"
              onClick={handleDesktopNext}
              title={!canProceed ? disabledHint : undefined}
            >
              далее
            </button>
          </div>
        </div>
      </div>
  );
};

export default EmbroideryDesktop;
