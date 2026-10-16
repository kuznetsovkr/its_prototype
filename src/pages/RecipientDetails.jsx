import { lazy, Suspense, useEffect } from "react";
import { Link } from "react-router-dom";
import { AddressSuggestions } from "react-dadata";
import "react-dadata/dist/react-dadata.css";
import { IS_DEMO_MODE } from "../config/demoMode";
import { MEDIA_QUERIES } from "../config/breakpoints";
import { useRecipientDetails } from "../features/order/recipient/useRecipientDetails";
import TurnstilePanel from "../components/TurnstilePanel";
import RecipientPersonalFields from "../features/order/shared/RecipientPersonalFields";
import OrderCertificateField from "../features/order/recipient/OrderCertificateField";
import RecipientDeliveryFields from "../features/order/recipient/RecipientDeliveryFields";
import RecipientCartList from "../features/cart/RecipientCartList";
import { GROUP_PAYMENT_NOTICE } from "../features/cart/cartPresentation";
import recipientBackIcon from "../images/order/recipient-back.svg";
import orderBackIconTablet from "../images/order/order-back-tablet.svg";
import orderBackIconMobile from "../images/order/order-back-mobile.svg";

const MyCdekWidget = lazy(() => import("../components/MyCdekWidget"));
const priceFormatter = new Intl.NumberFormat("ru-RU");

const RecipientDetails = () => {
  const {
    cart,
    shippingPackages,
    navigate, clothingProfile, clothingPreviewSrc, clothingPreviewAlt, isCustomType,
    fullNameInput, handleFullNameChange, isPaying,
    hasNoMiddleName, handleNoMiddleNameToggle,
    userData, handleInputChange, email, setEmail, isMobileLayout,
    preferredContact, setPreferredContact, orderComment, setOrderComment,
    isCdekPickerOpen, setIsCdekPickerOpen,
    pickupPoint, setPickupPoint, setDeliveryPrice, isNoCdek,
    isCdekPickupSelected, deliveryRecipient, setDeliveryRecipient,
    deliveryMethod, postalPoint, setPostalPoint, handleDeliveryMethodChange,
    deliveryCity, handleDeliveryCityChange, citySyncing, cityNotice, mapLocation, cityFixedLabel,
    recipientPhone, handleRecipientPhoneChange,
    deliveryComment, setDeliveryComment, privacyConsent, setPrivacyConsent,
    error, handlePayment, canSubmit, getSubmitDisabledMessage,
    handleCdekSelect, applyDemoPickup, handleNoCdekToggle,
    manualAddress, setManualAddress, dadataToken, isManualAddressFull,
    checkoutQuote, checkoutQuoteLoading, checkoutQuoteError,
    isManualCheckout, isCheckoutLocked,
    turnstile,
    certificate,
    isCertificateAvailable,
  } = useRecipientDetails();
  const formDisabled = isPaying || isCheckoutLocked || cart.busy;
  const showCart = cart.cartOnly || cart.items.length > 0;
  const turnstileClassName = turnstile.isVisible
    ? ` has-turnstile${turnstile.token ? " is-turnstile-verified" : ""}`
    : "";
  const formatPrice = (value) => `${priceFormatter.format(Number(value))} ₽`;

  useEffect(() => {
    if (!isCdekPickerOpen) return undefined;

    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - root.clientWidth;

    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
    };
  }, [isCdekPickerOpen]);

  return (
    <>
      <section className={`recipientOrderPage has-certificate${turnstileClassName}${showCart ? " has-cart" : ""}`} aria-labelledby="recipient-order-title">
        <div className="recipientOrderPage__stage">
          <div className="recipientOrderCard">
            <div className="recipientOrderCard__preview">
              <button
                type="button"
                className="recipientOrderCard__backArrow"
                onClick={() => cart.cartOnly ? navigate("/order") : navigate(-1)}
                disabled={isCheckoutLocked || cart.busy}
                aria-label="Вернуться назад"
                title={isCheckoutLocked ? "Заказ уже создан. Завершите или повторите оплату" : undefined}
              >
                <picture className="recipientOrderCard__backIcon">
                  <source media={MEDIA_QUERIES.mobile} srcSet={orderBackIconMobile} />
                  <source media={MEDIA_QUERIES.tabletMax} srcSet={orderBackIconTablet} />
                  <img src={recipientBackIcon} alt="" aria-hidden="true" />
                </picture>
              </button>

              <h1 className="recipientOrderCard__title" id="recipient-order-title">
                {showCart ? "ваш заказ" : "заказ изделия"}
              </h1>

              {showCart ? <RecipientCartList cart={cart} disabled={formDisabled} /> : <div className="recipientOrderCard__imageFrame">
                {clothingPreviewSrc ? (
                  <img className="is-product-preview" src={clothingPreviewSrc} alt={clothingPreviewAlt} />
                ) : (
                  <div className="orderProductPlaceholder" role="img" aria-label="Изображение товара не загружено">
                    <span>изображение не загружено</span>
                  </div>
                )}
              </div>}
            </div>

            <div className="recipientOrderCard__controls">
              <div className="recipientOrderForm recipientOrderForm--certificate recipientOrderForm--deliveryMethods">
                <h2 className="recipientOrderForm__heading recipientOrderForm__heading--personal">
                  Введите свои данные
                </h2>

                <RecipientPersonalFields
                  fullName={fullNameInput} onFullNameChange={handleFullNameChange}
                  phone={userData.phone} onPhoneChange={handleInputChange}
                  email={email} onEmailChange={(event) => setEmail(event.target.value)}
                  preferredContact={preferredContact} onContactChange={(event) => setPreferredContact(event.target.value)}
                  comment={orderComment} onCommentChange={(event) => setOrderComment(event.target.value)}
                  hasNoMiddleName={hasNoMiddleName} onNoMiddleNameChange={handleNoMiddleNameToggle}
                  disabled={formDisabled} compact={isMobileLayout}
                />

                <RecipientDeliveryFields
                  city={deliveryCity} onCityChange={handleDeliveryCityChange} citySyncing={citySyncing} cityNotice={cityNotice} cityFixedLabel={cityFixedLabel}
                  deliveryMethod={deliveryMethod} onMethodChange={handleDeliveryMethodChange}
                  disabled={formDisabled || (cart.isGroup && !cart.items.length)} cdekOnly={cart.isGroup}
                  pickupPoint={pickupPoint} isCdekPickupSelected={isCdekPickupSelected} onOpenCdek={() => setIsCdekPickerOpen(true)}
                  postalPoint={postalPoint} onPostalPointChange={setPostalPoint} manualAddress={manualAddress}
                  deliveryRecipient={deliveryRecipient} onRecipientChange={setDeliveryRecipient}
                  recipientPhone={recipientPhone} onRecipientPhoneChange={handleRecipientPhoneChange}
                  deliveryComment={deliveryComment} onCommentChange={setDeliveryComment}
                />

                <div className="recipientOrderForm__checkoutTail">
                <OrderCertificateField certificate={certificate} disabled={formDisabled || cart.paymentBlocked} manual={isManualCheckout} demo={!isCertificateAvailable} quoteError={checkoutQuoteError} quote={checkoutQuote} loading={checkoutQuoteLoading} />
                <div className="recipientOrderSummary" aria-live="polite">
                  {cart.paymentBlocked || cart.requiresCurrentSave ? (
                    <span>{cart.draftItem ? getSubmitDisabledMessage() : GROUP_PAYMENT_NOTICE}</span>
                  ) : isManualCheckout ? (
                    <>
                      <strong>Стоимость рассчитает менеджер после отправки заявки</strong>
                      {isCustomType && cart.items.length > 0 && <span>Индивидуальная заявка отправляется отдельно. Изделия в корзине в неё не входят.</span>}
                    </>
                  ) : checkoutQuoteLoading ? (
                    <span>Рассчитываем итоговую стоимость…</span>
                  ) : checkoutQuoteError ? (
                    <span className="recipientOrderSummary__error" id="order-quote-error">{checkoutQuoteError}</span>
                  ) : checkoutQuote ? (
                    <>
                      <span>{cart.isGroup ? "Все изделия и вышивка" : "Изделие и вышивка"}: {formatPrice(checkoutQuote.merchandisePrice)}</span>
                      <span>Доставка: {formatPrice(checkoutQuote.deliveryPrice)}</span>
                      {checkoutQuote.certificateDiscount > 0 && <span>Сертификат: −{formatPrice(checkoutQuote.certificateDiscount)}</span>}
                      {checkoutQuote.certificate && <span>Останется на сертификате: {formatPrice(checkoutQuote.certificate.remaining)}</span>}
                      <strong>
                        {checkoutQuote.paymentTestMode
                          ? `К оплате: ${formatPrice(checkoutQuote.paymentAmount)} (тест)`
                          : `${checkoutQuote.certificateDiscount > 0 ? "К оплате" : "Итого"}: ${formatPrice(checkoutQuote.amountDue ?? checkoutQuote.totalPrice)}`}
                      </strong>
                    </>
                  ) : null}
                </div>

                <label className="recipientOrderForm__consent">
                  <input
                    type="checkbox"
                    checked={privacyConsent}
                    onChange={(event) => setPrivacyConsent(event.target.checked)}
                    disabled={formDisabled}
                  />
                  <span>
                    Я даю <em>своё согласие на обработку моих персональных данных</em> в соответствии с{" "}
                    <Link
                      className="recipientOrderForm__legalLink"
                      to="/privacy"
                      target="_blank"
                      rel="noreferrer"
                    >
                      политикой конфиденциальности
                    </Link>
                  </span>
                </label>

                {(!cart.cartOnly || (cart.items.length > 0 && !cart.activeCheckout)) && <TurnstilePanel challenge={turnstile} disabled={formDisabled} />}
                </div>
              </div>

              {error && <p className={cart.isGroup ? "recipientCartActionError" : "recipientOrderCard__error"} role="alert">{error}</p>}
              {cart.activeCheckout && <div className="recipientCartCheckout" aria-live="polite">
                <p>{cart.activeCheckout.paymentStatus === "review"
                  ? "Оплата получена. Заказ требует проверки менеджером — повторно платить не нужно."
                  : `Заказ №${cart.activeCheckout.orderId} создан. Состав и сумма зафиксированы на время резерва.`}</p>
                {cart.activeCheckout.paymentStatus === "pending" && <button type="button" className="recipientCart__retry"
                  disabled={cart.busy || isPaying} onClick={cart.cancelCheckout}>Отменить оформление и изменить корзину</button>}
                {cart.activeCheckout.paymentStatus === "pending" && <p>После отмены не оплачивайте прежнюю ссылку.</p>}
              </div>}
              {!showCart && cart.uiError && <div className="recipientCartActionError">
                <p role="alert">{cart.uiError}</p>
                {cart.error && <button type="button" className="recipientCart__retry" disabled={cart.busy}
                  onClick={() => cart.reloadCart().catch(() => undefined)}>Повторить загрузку корзины</button>}
              </div>}

              <div className="recipientOrderNavigation">
                <button
                  type="button"
                  className="recipientOrderNavigation__cart"
                  disabled={cart.cartOnly ? formDisabled : !cart.canAdd}
                  onClick={cart.cartOnly ? () => navigate("/order") : cart.addCurrentItem}
                  aria-label={cart.cartOnly ? "Создать ещё одно изделие" : "Добавить в корзину"}
                  aria-describedby="recipient-cart-hint"
                  title={cart.addError || undefined}
                >
                  <span>{cart.saving ? "сохраняем…" : cart.cartOnly ? "создать ещё изделие" : "добавить в корзину"}</span>
                  <small id="recipient-cart-hint" className="recipientOrderNavigation__cartHint">
                    {cart.cartOnly ? "Вернуться к выбору изделия" : "Нажмите, если хотите сделать ещё одно изделие"}
                  </small>
                </button>
                <button
                  type="button"
                  className="recipientOrderNavigation__submit"
                  onClick={cart.requiresCurrentSave ? cart.confirmCurrentItem : handlePayment}
                  disabled={isPaying || (cart.requiresCurrentSave ? !cart.canAdd : !canSubmit)}
                  title={cart.requiresCurrentSave ? cart.addError || GROUP_PAYMENT_NOTICE : !canSubmit ? getSubmitDisabledMessage() : undefined}
                >
                  {isPaying ? "Обрабатываем..." : cart.requiresCurrentSave ? "подтвердить состав" : isManualCheckout ? "отправить заявку" : checkoutQuote?.requiresBankPayment === false ? "оформить заказ" : checkoutQuote?.paymentTestMode
                    ? `к оплате ${formatPrice(checkoutQuote.paymentAmount)}`
                    : "к оплате"}
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
        <section
          className={`recipientCdekDialog__surface${isNoCdek ? " is-manual" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label={isNoCdek ? "Указание адреса ручной доставки" : "Выбор пункта СДЭК"}
        >
          <div className="recipientCdekDialog__header">
            <h2>{isNoCdek ? "Укажите адрес доставки" : "Выберите пункт получения"}</h2>
            <button type="button" onClick={() => setIsCdekPickerOpen(false)} aria-label="Закрыть">
              <span aria-hidden="true" />
            </button>
          </div>

          <div className={`blockCDEK recipientCdekDialog__content${isNoCdek ? " is-manual" : ""}`}>
            {!isNoCdek && (
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
            )}
            {!IS_DEMO_MODE && isCdekPickerOpen && !isNoCdek && (
              <Suspense fallback={<p className="cdek-map__loading">Загружаем карту…</p>}>
                <MyCdekWidget
                  initialLocation={mapLocation}
                  clothingProfile={clothingProfile}
                  shippingPackages={shippingPackages}
                  onAddressSelect={setPickupPoint}
                  onRateSelect={setDeliveryPrice}
                  onCdekSelect={handleCdekSelect}
                />
              </Suspense>
            )}
            {IS_DEMO_MODE && !isNoCdek && (
              <button type="button" className="demoPickupButton" onClick={applyDemoPickup}>
                Select demo pickup point
              </button>
            )}
            {!cart.isGroup && <label className={`recipientCdekDialog__manualToggle${isNoCdek ? " is-active" : ""}`}>
              <input type="checkbox" checked={isNoCdek} onChange={handleNoCdekToggle} />
              <span>В моём городе нет СДЭКа</span>
            </label>}
            {isNoCdek && (
              <div className="manualAddress">
                <div className="manualAddress__intro">
                  <span>ручное оформление</span>
                  <h3>Куда нужно доставить заказ?</h3>
                  <p>
                    Начните вводить адрес и выберите вариант с номером дома. Менеджер уточнит способ,
                    срок и стоимость доставки после отправки заявки.
                  </p>
                </div>
                <span className="manualAddress__label">Адрес с номером дома</span>
                {IS_DEMO_MODE ? (
                  <input
                    type="text"
                    className="manualAddress__input"
                    placeholder="Введите адрес доставки"
                    aria-label="Адрес ручной доставки"
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
                    inputProps={{
                      placeholder: "Например, Красноярск, улица Мира, 10",
                      "aria-label": "Адрес ручной доставки",
                    }}
                  />
                )}
                {!IS_DEMO_MODE && !isManualAddressFull && (
                  <p className="manualAddress__hint">Выберите подходящую подсказку с указанным номером дома.</p>
                )}
                {manualAddress?.value && (
                  <div className={`manualAddress__selected${isManualAddressFull ? " is-complete" : ""}`}>
                    <span aria-hidden="true">{isManualAddressFull ? "✓" : "!"}</span>
                    <p>
                      <small>{isManualAddressFull ? "Адрес выбран" : "Уточните номер дома"}</small>
                      <strong>{manualAddress.value}</strong>
                    </p>
                  </div>
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
