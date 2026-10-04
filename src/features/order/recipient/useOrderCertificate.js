import { useEffect, useState } from "react";

export const normalizeOrderCertificateCode = (value) => String(value || "").replace(/[\s-]+/g, "").toUpperCase();
export const validateOrderCertificateCode = (value) => /^ITS[A-F0-9]{32}$/.test(normalizeOrderCertificateCode(value))
  ? "" : "Проверьте код сертификата из письма";

export const useOrderCertificate = (initialCode, setRecipient) => {
  const [input, setInput] = useState(initialCode || "");
  const [appliedCode, setAppliedCode] = useState(initialCode || "");
  const [error, setError] = useState("");
  useEffect(() => { setRecipient({ certificateCode: appliedCode }); }, [appliedCode, setRecipient]);
  const change = (value) => {
    setInput(value);
    setError("");
    if (normalizeOrderCertificateCode(value) !== appliedCode) setAppliedCode("");
  };
  const apply = () => {
    const validation = validateOrderCertificateCode(input);
    setError(validation);
    if (!validation) setAppliedCode(normalizeOrderCertificateCode(input));
  };
  const clear = () => { setInput(""); setAppliedCode(""); setError(""); };
  return { input, appliedCode, error, change, apply, clear,
    hasUnappliedCode: Boolean(input.trim()) && normalizeOrderCertificateCode(input) !== appliedCode };
};
