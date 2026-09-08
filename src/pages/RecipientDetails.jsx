import MyCdekWidget from "../components/MyCdekWidget";
import { AddressSuggestions } from "react-dadata";
import "react-dadata/dist/react-dadata.css";
import { IS_DEMO_MODE } from "../config/demoMode";
import { useRecipientDetails } from "../features/order/recipient/useRecipientDetails";
import figmaTshirtImg from "../images/order/tshirt-black.png";
import recipientBackIcon from "../images/order/recipient-back.svg";
import orderBackIconTablet from "../images/order/order-back-tablet.svg";
import orderBackIconMobile from "../images/order/order-back-mobile.svg";
import recipientRadioOuter from "../images/order/recipient-radio-outer.svg";
import recipientRadioInner from "../images/order/recipient-radio-inner.svg";
import recipientRadioTablet from "../images/order/recipient-radio-tablet.svg";
import recipientRadioMobile from "../images/order/recipient-radio-mobile.svg";

const RecipientDetails = () => {
  const {
    navigate, productType, isCustomType, fullNameInput, handleFullNameChange, isPaying,
    userData, handleInputChange, email, setEmail, isMobileLayout,
    preferredContact, setPreferredContact, orderComment, setOrderComment,
    city, setCity, isCdekPickerOpen, setIsCdekPickerOpen,
    pickupPoint, setPickupPoint, setDeliveryPrice, isNoCdek,
    isCdekPickupSelected, deliveryRecipient, setDeliveryRecipient,
    deliveryComment, setDeliveryComment, privacyConsent, setPrivacyConsent,
    error, handlePayment, isFormValid, getMissingFieldsMessage,
    handleCdekSelect, applyDemoPickup, handleNoCdekToggle,
    manualAddress, setManualAddress, dadataToken, isManualAddressFull,
  } = useRecipientDetails();

  return (
    <>
      <section className="recipientOrderPage" aria-labelledby="recipient-order-title">
        <div className="recipientOrderPage__stage">
          <div className="recipientOrderCard">
            <div className="recipientOrderCard__preview">
              <button
                type="button"
                className="recipientOrderCard__backArrow"
                onClick={() => navigate(-1)}
                aria-label="Вернуться назад"
              >
                <picture className="recipientOrderCard__backIcon">
                  <source media="(max-width: 639px)" srcSet={orderBackIconMobile} />
                  <source media="(max-width: 1279px)" srcSet={orderBackIconTablet} />
                  <img src={recipientBackIcon} alt="" aria-hidden="true" />
                </picture>
              </button>

              <h1 className="recipientOrderCard__title" id="recipient-order-title">
                заказ изделия
              </h1>

              <div className="recipientOrderCard__imageFrame">
                <img src={figmaTshirtImg} alt="Чёрная футболка" />
              </div>
            </div>

            <div className="recipientOrderCard__controls">
              <div className="recipientOrderForm">
                <h2 className="recipientOrderForm__heading recipientOrderForm__heading--personal">
                  Введите свои данные
                </h2>

                <input
                  className="recipientOrderForm__field recipientOrderForm__field--fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="ФИО"
                  value={fullNameInput}
                  onChange={handleFullNameChange}
                  disabled={isPaying}
                />

                <div className="recipientOrderForm__phoneField">
                  <input
                    className="recipientOrderForm__field recipientOrderForm__field--phone"
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    placeholder="Номер телефона"
                    value={userData.phone}
                    onChange={handleInputChange}
                    disabled={isPaying}
                    maxLength={18}
                  />
                </div>

                <input
                  className="recipientOrderForm__field recipientOrderForm__field--email"
                  type="email"
                  autoComplete="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isPaying}
                />

                <input
                  className="recipientOrderForm__field recipientOrderForm__field--contact"
                  type="text"
                  placeholder={isMobileLayout ? "Удобный способ связи" : "Удобный способ связи ( Telegram / VK / другое )"}
                  value={preferredContact}
                  onChange={(event) => setPreferredContact(event.target.value)}
                  disabled={isPaying}
                />

                <textarea
                  className="recipientOrderForm__field recipientOrderForm__field--orderComment"
                  placeholder="Комментарий / пожелание к заказу"
                  value={orderComment}
                  onChange={(event) => setOrderComment(event.target.value)}
                  disabled={isPaying}
                />

                <h2 className="recipientOrderForm__heading recipientOrderForm__heading--delivery">
                  Доставка
                </h2>

                <label className="recipientOrderForm__group recipientOrderForm__group--city">
                  <span>Город</span>
                  <input
                    type="text"
                    placeholder={isMobileLayout ? "Санкт - Петербург" : "Санкт-Петербург"}
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    disabled={isPaying}
                  />
                </label>

                <button
                  type="button"
                  className="recipientOrderForm__deliveryMethod"
                  onClick={() => setIsCdekPickerOpen(true)}
                >
                  <span className="recipientOrderForm__radio" aria-hidden="true">
                    <picture className="recipientOrderForm__radioResponsive">
                      <source media="(max-width: 639px)" srcSet={recipientRadioMobile} />
                      <img src={recipientRadioTablet} alt="" />
                    </picture>
                    <img className="recipientOrderForm__radioOuter" src={recipientRadioOuter} alt="" />
                    <img className="recipientOrderForm__radioInner" src={recipientRadioInner} alt="" />
                  </span>
                  <span className="recipientOrderForm__deliveryMethodText">
                    <strong>СДЭК — </strong>
                    Доставка до пункта выдачи заказов <span>от 4 дней, от 450 р</span>
                  </span>
                </button>

                <label className="recipientOrderForm__group recipientOrderForm__group--pickup">
                  <span>Пункт получения</span>
                  <button
                    type="button"
                    onClick={() => setIsCdekPickerOpen(true)}
                    aria-describedby={
                      !isNoCdek && !isCdekPickupSelected
                        ? "recipient-pickup-validation"
                        : undefined
                    }
                    aria-label={
                      isCdekPickupSelected
                        ? `Выбран пункт получения: ${pickupPoint}`
                        : "Выберите пункт получения СДЭК"
                    }
                  >
                    {pickupPoint || "Выберите пункт получения"}
                  </button>
                  {!isNoCdek && !isCdekPickupSelected && (
                    <small
                      className="recipientOrderForm__validation"
                      id="recipient-pickup-validation"
                    >
                      Выберите ПВЗ, чтобы продолжить
                    </small>
                  )}
                </label>

                <label className="recipientOrderForm__group recipientOrderForm__group--recipient">
                  <span>Получатель (ФИО полностью)</span>
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder="Иванов Иван Иванович"
                    value={deliveryRecipient}
                    onChange={(event) => setDeliveryRecipient(event.target.value)}
                    disabled={isPaying}
                  />
                </label>

                <label className="recipientOrderForm__group recipientOrderForm__group--deliveryComment">
                  <span>Комментарий</span>
                  <input
                    type="text"
                    placeholder="Комментарий к доставке"
                    value={deliveryComment}
                    onChange={(event) => setDeliveryComment(event.target.value)}
                    disabled={isPaying}
                  />
                </label>

                <label className="recipientOrderForm__consent">
                  <input
                    type="checkbox"
                    checked={privacyConsent}
                    onChange={(event) => setPrivacyConsent(event.target.checked)}
                  />
                  <span>
                    Я даю <em>своё согласие на обработку моих персональных данных</em> в соответствии с <em>политикой конфиденциальности</em>
                  </span>
                </label>
              </div>

              {error && <p className="recipientOrderCard__error" role="alert">{error}</p>}

              <div className="recipientOrderNavigation">
                <button type="button" className="recipientOrderNavigation__back" onClick={() => navigate(-1)}>
                  назад
                </button>
                <button
                  type="button"
                  className="recipientOrderNavigation__submit"
                  onClick={handlePayment}
                  disabled={!isFormValid || isPaying}
                  title={!isFormValid ? getMissingFieldsMessage() : undefined}
                >
                  {isPaying ? "Обрабатываем..." : isCustomType ? "отправить заявку" : (
                    <>
                      <span className="recipientOrderNavigation__paymentLabel">к оплате</span>
                      <span className="recipientOrderNavigation__tabletLabel">далее</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div
        className={`recipientCdekDialog${isCdekPickerOpen ? " is-open" : ""}`}
        aria-hidden={!isCdekPickerOpen}
      >
        <button
          type="button"
          className="recipientCdekDialog__backdrop"
          onClick={() => setIsCdekPickerOpen(false)}
          aria-label="Закрыть выбор пункта получения"
        />
        <section className="recipientCdekDialog__surface" role="dialog" aria-modal="true" aria-label="Выбор пункта СДЭК">
          <div className="recipientCdekDialog__header">
            <h2>Выберите пункт получения</h2>
            <button type="button" onClick={() => setIsCdekPickerOpen(false)} aria-label="Закрыть">×</button>
          </div>

          <div className="blockCDEK recipientCdekDialog__content">
            <div className="mapBox">
              <div id="cdek-map">
                {IS_DEMO_MODE && (
                  <div className="cdek-map__demo">
                    <p className="cdek-map__demo-title">CDEK map placeholder (demo mode)</p>
                    <p className="cdek-map__demo-text">Use the button below to emulate pickup-point selection.</p>
                  </div>
                )}
              </div>
            </div>
            {!IS_DEMO_MODE && (
              <MyCdekWidget
                productType={productType}
                onAddressSelect={setPickupPoint}
                onRateSelect={setDeliveryPrice}
                onCdekSelect={handleCdekSelect}
              />
            )}
            {IS_DEMO_MODE && !isNoCdek && (
              <button type="button" className="demoPickupButton" onClick={applyDemoPickup}>
                Select demo pickup point
              </button>
            )}
            <label className="recipientCdekDialog__manualToggle">
              <input type="checkbox" checked={isNoCdek} onChange={handleNoCdekToggle} />
              В моём городе нет СДЭКа
            </label>
            {isNoCdek && (
              <div className="manualAddress">
                {IS_DEMO_MODE ? (
                  <input
                    type="text"
                    className="manualAddress__input"
                    placeholder="Введите адрес доставки"
                    value={manualAddress?.value || ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      setManualAddress({
                        value,
                        data: { house: value.trim() ? "1" : "", block: "", flat: "" },
                      });
                    }}
                  />
                ) : (
                  <AddressSuggestions
                    token={dadataToken}
                    value={manualAddress}
                    onChange={setManualAddress}
                    inputProps={{ placeholder: "Введите свой адрес" }}
                  />
                )}
                {!IS_DEMO_MODE && !isManualAddressFull && (
                  <p className="manualAddress__hint">Пожалуйста, выберите подсказку с указанием дома.</p>
                )}
                {manualAddress?.value && (
                  <p className="manualAddress__selected">Вы выбрали: {manualAddress.value}</p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
};


export default RecipientDetails;
