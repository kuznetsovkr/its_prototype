import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ReactComponent as CheckIcon } from "../images/Vector.svg";
import orderBackMobile from "../images/order/order-back-mobile.svg";
import { CORE_SIZES, detectChartKey, isWhite, normalizeKey } from "../features/order/clothing/clothingCatalog";
import SizeGuideModal from "../features/order/clothing/SizeGuideModal";
import { useClothingSelection } from "../features/order/clothing/useClothingSelection";

const ClothingSelector = () => {
  const navigate = useNavigate();
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [chartKey, setChartKey] = useState("default");
  const {
    selectedClothing, selectedInnerType, selectedColor, selectedSize,
    setSelectedSize, baseTypeOptions, presentInnerOptions, needsInner,
    colorOptions, sizeOptions, availableSizes, canProceed,
    displayPreviewSrc, displayPreviewAlt, displayPrice,
    handleSelectClothing, handleSelectInnerType, handleSelectColor,
  } = useClothingSelection();

  const openSizeGuide = () => {
    setChartKey(detectChartKey(selectedClothing));
    setShowSizeModal(true);
  };

  return (
    <>
      <div className="blockClothingSelector">
        <div className="clothing-block">
          <button type="button" className="clothingSelectorMobile__arrow" onClick={() => navigate(-1)} aria-label="Вернуться назад">
            <img src={orderBackMobile} alt="" aria-hidden="true" />
          </button>
          <h1 className="orderStepTitle" id="order-clothing-title">заказ изделия</h1>
          <div className="image-wrapper">
            <div className="image-frame">
              <div className="image-stack" aria-live="polite">
                <img src={displayPreviewSrc} alt={displayPreviewAlt} className="clotheImage" draggable="false" />
              </div>
            </div>
          </div>
        </div>

        <div className="clothingControls">
          <div className="blockSelection">
            <div className="selectorGroup selectorGroup--type">
              <p className="title">Выберите изделие</p>
              <div className="selectorType">
                {baseTypeOptions.length === 0 && <div className="muted">Нет доступных товаров</div>}
                {baseTypeOptions.map((option) => (
                  <label
                    className={`selectorType__item ${normalizeKey(selectedClothing) === normalizeKey(option.label) ? "active" : ""} ${option.isAvailable ? "" : "is-disabled"}`}
                    key={option.label}
                    title={option.isAvailable ? "" : "Нет в наличии"}
                  >
                    <input
                      type="radio" name="clothing" value={option.label}
                      checked={normalizeKey(selectedClothing) === normalizeKey(option.label)}
                      onChange={(event) => handleSelectClothing(event.target.value)}
                      disabled={!option.isAvailable}
                    />
                    <span className="selectorType__custom"><CheckIcon className="selectorType__check" /></span>
                    {option.label}
                  </label>
                ))}
              </div>
              {needsInner && (
                <div className="selectorType selectorType--inner">
                  {presentInnerOptions.map((inner) => (
                    <label className={`selectorType__item ${selectedInnerType === inner ? "active" : ""}`} key={inner}>
                      <input type="radio" name="innerType" value={inner} checked={selectedInnerType === inner} onChange={(event) => handleSelectInnerType(event.target.value)} />
                      <span className="selectorType__custom"><CheckIcon className="selectorType__check" /></span>
                      {inner}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="selectorGroup selectorGroup--color">
              <p className="title">Цвет</p>
              <div className="colorSelector">
                {!needsInner || selectedInnerType ? (
                  colorOptions.length > 0 ? colorOptions.map((option) => (
                    <button
                      type="button" key={option.label}
                      className={`colorSquare ${normalizeKey(selectedColor) === normalizeKey(option.label) && option.isAvailable ? "active" : ""} ${option.isAvailable ? "" : "is-disabled"}`}
                      style={{
                        backgroundColor: option.isAvailable ? option.code : "#e4e4e4",
                        border: option.isAvailable && isWhite(option.code) && normalizeKey(selectedColor) !== normalizeKey(option.label)
                          ? "1px solid #b4b4b4" : undefined,
                      }}
                      title={option.isAvailable ? option.label : `${option.label}: нет в наличии`}
                      aria-label={option.isAvailable ? option.label : `${option.label}: нет в наличии`}
                      onClick={() => handleSelectColor(option.label)} disabled={!option.isAvailable}
                    />
                  )) : <div className="muted">Нет доступных цветов</div>
                ) : <div className="muted">Сначала выберите вариант («с начёсом» / «без начёса»)</div>}
              </div>
            </div>

            <div className="selectorGroup selectorGroup--size">
              <div className="selectorGroup__heading">
                <p className="title">Размер</p>
                <div className="tableSize" onClick={openSizeGuide}>Таблица размеров</div>
              </div>
              <div className={`sizeSelector${sizeOptions.length > CORE_SIZES.length ? " sizeSelector--six" : ""}`}>
                {sizeOptions.map((size) => {
                  const isAvailable = availableSizes.includes(size);
                  return (
                    <label className={`sizeSelector__item ${isAvailable ? "" : "is-disabled"}`} key={size} title={isAvailable ? "" : "Нет в наличии"}>
                      <input type="radio" name="size" value={size} checked={selectedSize === size} onChange={(event) => setSelectedSize(event.target.value)} disabled={!isAvailable} />
                      <span className="sizeSelector__box">{size}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <p className="clothingPrice">Цена: {displayPrice}</p>
          </div>

          <div className="orderNavigation">
            <button type="button" className="orderActionButton orderActionButton--back" onClick={() => navigate(-1)}>назад</button>
            <button type="button" className="orderActionButton orderActionButton--next" onClick={() => canProceed && navigate("/embroidery")} disabled={!canProceed}>далее</button>
          </div>
        </div>
      </div>

      {showSizeModal && <SizeGuideModal chartKey={chartKey} onChartChange={setChartKey} onClose={() => setShowSizeModal(false)} />}
    </>
  );
};

export default ClothingSelector;
