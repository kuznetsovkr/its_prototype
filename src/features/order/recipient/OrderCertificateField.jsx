const OrderCertificateField = ({ certificate, disabled, manual, demo, quoteError }) => (
  <div className="orderCertificate">
    <label htmlFor="order-certificate-code">Промокод</label>
    <div className="orderCertificate__entry">
      <input
        id="order-certificate-code"
        placeholder="Промокод / Сертификат"
        value={certificate.input}
        onChange={(event) => certificate.change(event.target.value)}
        maxLength={80}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        disabled={disabled || manual || demo}
        aria-describedby={`order-certificate-help${certificate.appliedCode && quoteError ? " order-quote-error" : ""}`}
        aria-invalid={Boolean(certificate.error || (certificate.appliedCode && quoteError))}
        onKeyDown={(event) => {
          if (event.key === "Enter") { event.preventDefault(); certificate.apply(); }
        }}
      />
      {certificate.input && (
        <button type="button" disabled={disabled} onClick={certificate.clear}>Удалить</button>
      )}
      {!certificate.appliedCode && !manual && !demo && (
        <button type="button" disabled={disabled || !certificate.input.trim()} onClick={certificate.apply}>Применить</button>
      )}
    </div>
    <small id="order-certificate-help" aria-live="polite">
      {certificate.error || (demo ? "В демонстрационном режиме сертификаты не применяются" : manual
        ? "Сертификат можно применить после расчёта стоимости менеджером"
        : "Сертификат покрывает изделие с вышивкой, но не доставку")}
    </small>
  </div>
);
export default OrderCertificateField;
