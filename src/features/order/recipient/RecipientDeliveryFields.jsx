import { POSTAL_POINT_MAX_LENGTH, SELF_PICKUP } from "../../../config/delivery";
import { normalizePhoneDigits } from "./recipientValidation";
import radioOuter from "../../../images/order/delivery-radio-outer.svg";
import radioInactive from "../../../images/order/delivery-radio-inactive.svg";
import radioActive from "../../../images/order/delivery-radio-active.svg";

const options = [
  { value: "cdek", label: "СДЭК", description: "Доставка до пункта выдачи заказов", detail: "срок и стоимость — после выбора ПВЗ" },
  { value: "russian_post", label: "Почта России", description: "Доставка до отделения", detail: "срок и стоимость уточнит менеджер" },
  { value: "pickup", label: "Самовывоз" },
];

const RecipientDeliveryFields = ({
  deliveryMethod, onMethodChange, disabled, pickupPoint, isCdekPickupSelected, onOpenCdek,
  postalPoint, onPostalPointChange, manualAddress,
  deliveryRecipient, onRecipientChange, recipientPhone, onRecipientPhoneChange,
  deliveryComment, onCommentChange, cdekOnly = false,
}) => {
  const recipientPhoneInvalid = Boolean(deliveryRecipient.trim()) && !/^7\d{10}$/.test(normalizePhoneDigits(recipientPhone));
  const isManual = deliveryMethod === "manual";
  return (
    <div className="recipientOrderForm__delivery">
      <h2 className="recipientOrderForm__heading recipientOrderForm__heading--delivery">Доставка</h2>
      <fieldset className="recipientDeliveryMethods" aria-label="Способ получения" disabled={disabled}>
        {options.map(({ value, label, description, detail }) => (
          <label className="recipientOrderForm__deliveryMethod" key={value}>
            <input className="recipientDeliveryMethods__input" type="radio" name="deliveryMethod" value={value}
              aria-label={label} disabled={cdekOnly && value !== "cdek"} checked={deliveryMethod === value} onChange={() => onMethodChange(value)} />
            <span className="recipientDeliveryMethods__radio" aria-hidden="true">
              <img className="recipientDeliveryMethods__outer" src={radioOuter} alt="" />
              <img className="recipientDeliveryMethods__dot" src={deliveryMethod === value ? radioActive : radioInactive} alt="" />
            </span>
            <span className="recipientOrderForm__deliveryMethodText">
              <strong>{label}{description ? " — " : ""}</strong>{description}
              {detail && <span>{detail}</span>}
            </span>
          </label>
        ))}
      </fieldset>
      {cdekOnly && <p className="recipientDeliveryDetails__hint">Для онлайн-оплаты корзины сейчас доступен СДЭК. Каждое изделие рассчитывается как отдельное место.</p>}

      <div className="recipientDeliveryDetails">
        {deliveryMethod === "pickup" ? (
          <div className="recipientOrderForm__group recipientOrderForm__group--pickup">
            <span>Пункт получения</span>
            <div className="recipientDeliveryDetails__pickup" aria-label="Адрес самовывоза">
              <span>{SELF_PICKUP.address}</span><em>{SELF_PICKUP.schedule}</em>
            </div>
          </div>
        ) : deliveryMethod === "russian_post" ? (
          <label className="recipientOrderForm__group recipientOrderForm__group--pickup">
            <span>Пункт получения</span>
            <input type="text" value={postalPoint} onChange={(event) => onPostalPointChange(event.target.value)} disabled={disabled}
              aria-label="Отделение Почты России" aria-describedby="recipient-postal-help" maxLength={POSTAL_POINT_MAX_LENGTH}
              placeholder="Индекс и адрес отделения" />
            <small className="recipientDeliveryDetails__hint" id="recipient-postal-help">
              Пока укажите отделение вручную. Менеджер проверит его и уточнит стоимость доставки перед оплатой.
            </small>
          </label>
        ) : (
          <label className="recipientOrderForm__group recipientOrderForm__group--pickup">
            <span>{isManual ? "Адрес ручной доставки" : "Пункт получения"}</span>
            <button type="button" onClick={onOpenCdek} disabled={disabled}
              aria-describedby={!isManual && !isCdekPickupSelected ? "recipient-pickup-validation" : undefined}
              aria-label={isManual ? "Указать адрес ручной доставки" : isCdekPickupSelected
                ? `Выбран пункт получения: ${pickupPoint}` : "Выберите пункт получения СДЭК"}>
              {isManual ? manualAddress?.value || "Укажите адрес доставки" : pickupPoint || "Выберите пункт получения"}
            </button>
            {!isManual && !isCdekPickupSelected && <small className="recipientOrderForm__validation" id="recipient-pickup-validation">Выберите ПВЗ, чтобы продолжить</small>}
          </label>
        )}

        {deliveryMethod !== "pickup" && <>
          <label className="recipientOrderForm__group recipientOrderForm__group--recipient">
            <span>Другой получатель (ФИО, если отличается)</span>
            <input type="text" autoComplete="shipping name" placeholder="Иванов Иван Иванович" value={deliveryRecipient}
              onChange={(event) => onRecipientChange(event.target.value)} disabled={disabled} />
          </label>
          <label className="recipientOrderForm__group recipientOrderForm__group--recipientPhone">
            <span>Телефон другого получателя</span>
            <input type="tel" autoComplete="shipping tel" placeholder="+7 (999) 123-45-67" value={recipientPhone}
              onChange={onRecipientPhoneChange} disabled={disabled} maxLength={18} required={Boolean(deliveryRecipient.trim())}
              aria-invalid={recipientPhoneInvalid} aria-describedby={recipientPhoneInvalid ? "recipient-phone-validation" : undefined} />
            {recipientPhoneInvalid && <small className="recipientOrderForm__validation" id="recipient-phone-validation">Укажите корректный телефон получателя</small>}
          </label>
          <label className="recipientOrderForm__group recipientOrderForm__group--deliveryComment">
            <span>Комментарий</span>
            <input type="text" placeholder="Комментарий к доставке" value={deliveryComment}
              onChange={(event) => onCommentChange(event.target.value)} disabled={disabled} />
          </label>
        </>}
      </div>
    </div>
  );
};

export default RecipientDeliveryFields;
