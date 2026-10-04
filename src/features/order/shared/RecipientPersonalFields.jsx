const RecipientPersonalFields = ({
  fullName, onFullNameChange, phone, onPhoneChange, email, onEmailChange,
  preferredContact, onContactChange, comment, onCommentChange, disabled = false,
  emailRequired = false, hasNoMiddleName, onNoMiddleNameChange, compact = false, fullNameMaxLength,
}) => (
  <>
    <input className="recipientOrderForm__field recipientOrderForm__field--fullName"
      type="text" autoComplete="name" aria-label="ФИО"
      placeholder={hasNoMiddleName ? "Фамилия Имя" : "ФИО"}
      value={fullName} onChange={onFullNameChange} disabled={disabled} maxLength={fullNameMaxLength} />
    {hasNoMiddleName !== undefined && (
      <label className="recipientOrderForm__noMiddleName">
        <input type="checkbox" checked={hasNoMiddleName} onChange={onNoMiddleNameChange} disabled={disabled} />
        <span>У меня нет отчества</span>
      </label>
    )}
    <div className="recipientOrderForm__phoneField">
      <input className="recipientOrderForm__field recipientOrderForm__field--phone"
        type="tel" name="phone" autoComplete="tel" aria-label="Номер телефона"
        placeholder="Номер телефона" value={phone} onChange={onPhoneChange}
        disabled={disabled} maxLength={18} />
    </div>
    <input className="recipientOrderForm__field recipientOrderForm__field--email"
      type="email" autoComplete="email" aria-label="E-mail" placeholder="E-mail"
      value={email} onChange={onEmailChange} disabled={disabled} required={emailRequired} maxLength={254} />
    <input className="recipientOrderForm__field recipientOrderForm__field--contact"
      type="text" aria-label="Удобный способ связи"
      placeholder={compact ? "Удобный способ связи" : "Удобный способ связи ( Telegram / VK / другое )"}
      value={preferredContact} onChange={onContactChange} disabled={disabled} maxLength={80} />
    <textarea className="recipientOrderForm__field recipientOrderForm__field--orderComment"
      aria-label="Комментарий / пожелание к заказу" placeholder="Комментарий / пожелание к заказу"
      value={comment} onChange={onCommentChange} disabled={disabled} maxLength={2500} />
  </>
);
export default RecipientPersonalFields;
