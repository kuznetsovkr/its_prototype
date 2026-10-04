import { Link } from "react-router-dom";
import RecipientPersonalFields from "../order/shared/RecipientPersonalFields";
import TurnstilePanel from "../../components/TurnstilePanel";
import backIcon from "../../images/certificate/checkout-back.svg";
import glow from "../../images/certificate/checkout-glow.webp";
import ticket from "../../images/certificate/checkout-ticket.webp";
const money = (kopecks) => new Intl.NumberFormat("ru-RU").format(kopecks / 100) + " ₽";
const CertificateCheckout = ({ checkout }) => {
  const { phase, purchase, fields, updateField, config, busy, status, checking, error, turnstile } = checkout;
  const isStatus = phase === "status";
  const paid = status?.paid === true;
  const disabled = busy || Boolean(purchase);
  const unavailable = !config.loading && !config.enabled;
  const actionLabel = busy ? "Открываем оплату…" : "к оплате";
  const deliveryCopy = status?.emailDelivery === "sent"
    ? "Письмо с кодом отправлено на указанный email. Если его не видно, проверьте папку «Спам»."
    : status?.emailDelivery === "failed"
      ? "Оплата получена, но письмо пока не удалось отправить. Свяжитесь с нами — повторно платить не нужно."
      : "Оплата подтверждена. Готовим письмо с кодом на ваш email.";
  return (
    <section className="certificateCheckout" aria-labelledby="certificate-checkout-title">
      <article className="certificateCheckout__card">
        <header className="certificateCheckout__header">
          {!purchase && (
            <button type="button" className="certificateCheckout__back" onClick={() => checkout.setPhase("offer")} disabled={busy} aria-label="Вернуться к номиналам">
              <img src={backIcon} alt="" />
            </button>
          )}
          <h1 id="certificate-checkout-title">сертификат</h1>
        </header>
        <div className="certificateCheckout__body">
          <div className="certificateCheckout__preview">
            <img src={glow} className="certificateCheckout__glow" alt="" aria-hidden="true" />
            <img src={ticket} className="certificateCheckout__ticket" alt="Подарочный сертификат" />
            <p className="certificateCheckout__nominal">
              Номинал: {money(purchase?.nominalKopecks || checkout.denomination * 100)}
            </p>
          </div>
          <div className="certificateCheckout__controls">
            {isStatus ? (
              <section className="certificateCheckout__result" aria-live="polite">
                <h2>{paid ? "Спасибо за покупку!" : "Проверяем оплату"}</h2>
                <p>{paid ? deliveryCopy : checking
                  ? "Ожидаем подтверждение от PayKeeper. Возврат с платёжной страницы сам по себе не подтверждает оплату."
                  : "Подтверждение ещё не получено. Проверьте статус позже. Если деньги уже списались, повторно платить не нужно."}</p>
                {status?.expiresAt && <p>Действует до {new Intl.DateTimeFormat("ru-RU").format(new Date(status.expiresAt))}</p>}
                {status?.testMode && <p>Это тестовый сертификат для тестовых заказов.</p>}
                <button type="button" className="certificateCheckout__submit" onClick={checkout.checkStatus} disabled={checking}>Проверить статус</button>
                {!paid && <button type="button" className="certificateCheckout__secondary" onClick={checkout.startPayment} disabled={busy || !config.enabled}>Вернуться к оплате</button>}
                {paid && <button type="button" className="certificateCheckout__secondary" onClick={checkout.startNewPurchase}>К номиналам</button>}
                <Link className="certificateCheckout__home" to="/">На главную</Link>
              </section>
            ) : (
              <form onSubmit={(event) => { event.preventDefault(); checkout.startPayment(); }} noValidate>
                <div className="certificateCheckout__form recipientOrderForm">
                  <h2 className="recipientOrderForm__heading">Введите свои данные</h2>
                  <RecipientPersonalFields
                    fullName={fields.fullName} onFullNameChange={(event) => updateField("fullName", event.target.value)}
                    phone={fields.phone} onPhoneChange={(event) => updateField("phone", event.target.value)}
                    email={fields.email} onEmailChange={(event) => updateField("email", event.target.value)}
                    preferredContact={fields.preferredContact} onContactChange={(event) => updateField("preferredContact", event.target.value)}
                    comment={fields.comment} onCommentChange={(event) => updateField("comment", event.target.value)}
                    disabled={disabled} emailRequired compact fullNameMaxLength={200}
                  />
                  <label className="recipientOrderForm__consent">
                    <input type="checkbox" checked={fields.privacyConsent} onChange={(event) => updateField("privacyConsent", event.target.checked)} disabled={disabled} />
                    <span>Я даю <em>своё согласие на обработку моих персональных данных</em> в соответствии с{" "}
                      <Link className="recipientOrderForm__legalLink" to="/privacy" target="_blank" rel="noreferrer">политикой конфиденциальности</Link>
                    </span>
                  </label>
                  <TurnstilePanel challenge={turnstile} disabled={busy} />
                </div>
                <p className="certificateCheckout__payAmount">
                  К оплате: {money(purchase?.paymentAmountKopecks || (config.testMode ? 100 : checkout.denomination * 100))}
                  {(purchase?.testMode || config.testMode) && " (тест)"}
                </p>
                <button className="certificateCheckout__submit" type="submit" disabled={busy || !config.enabled || (!purchase && !turnstile.isSatisfied)}>
                  {actionLabel}
                </button>
                {purchase && <button type="button" className="certificateCheckout__secondary" onClick={() => checkout.setPhase("status")}>Проверить оплату</button>}
              </form>
            )}
            {(config.loading || unavailable) && (
              <p className="certificateCheckout__notice" role="status">
                {config.loading ? "Проверяем доступность покупки…" : "Форма готова. Оплата будет доступна после настройки доставки сертификатов на email."}
              </p>
            )}
            {error && <p className="certificateCheckout__error" role="alert">{error}</p>}
          </div>
        </div>
      </article>
    </section>
  );
};
export default CertificateCheckout;
