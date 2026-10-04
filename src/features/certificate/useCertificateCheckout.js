import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../api";
import { formatPhoneNumber } from "../order/recipient/recipientValidation";
import { useTurnstileChallenge } from "../order/recipient/useTurnstileChallenge";
import { validateCertificateBuyer } from "./certificateValidation";
import {
  clearCertificateCheckout, emptyCertificateBuyer, markCertificatePayment,
  readCertificateCheckout, saveCertificateCheckout,
} from "./certificateStorage";
export const DEFAULT_CERTIFICATE_DENOMINATIONS = [1000, 2000, 3000, 4000, 5000, 6000, 8000, 10000, 12000, 14000, 16000, 18000, 20000];
const accessConfig = (purchase) => ({ headers: { "X-Certificate-Access-Token": purchase.certificateToken } });
const loadCertificateConfig = async () => (await api.get("/certificates/config")).data;
export const useCertificateCheckout = () => {
  const [restored] = useState(() => readCertificateCheckout());
  const [denomination, setDenominationState] = useState(restored?.denomination || 1000);
  const [fields, setFields] = useState(restored?.fields || emptyCertificateBuyer);
  const [requestKey, setRequestKey] = useState(restored?.requestKey || "");
  const [purchase, setPurchase] = useState(restored?.purchase || null);
  const [phase, setPhase] = useState(restored?.purchase ? "status" : restored?.requestKey ? "form" : "offer");
  const [config, setConfig] = useState({ enabled: false, loading: true, denominations: DEFAULT_CERTIFICATE_DENOMINATIONS });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(null);
  const [checking, setChecking] = useState(false);
  const [checkAttempt, setCheckAttempt] = useState(0);
  const inFlight = useRef(false);
  const turnstile = useTurnstileChallenge({ disabled: phase !== "form" || !config.enabled || Boolean(purchase), loadConfig: loadCertificateConfig });
  const setDenomination = (value) => {
    if (busy || purchase) return;
    setDenominationState(value);
    setRequestKey("");
  };
  useEffect(() => {
    let active = true;
    api.get("/certificates/config").then(({ data }) => {
      if (active) setConfig({ ...data, loading: false, denominations: Array.isArray(data.denominations) && data.denominations.length ? data.denominations : DEFAULT_CERTIFICATE_DENOMINATIONS });
    }).catch(() => {
      if (active) setConfig({ enabled: false, loading: false, denominations: DEFAULT_CERTIFICATE_DENOMINATIONS });
    });
    return () => { active = false; };
  }, []);
  const updateField = (key, value) => {
    if (purchase || busy) return;
    setFields((previous) => ({ ...previous, [key]: key === "phone" ? formatPhoneNumber(value) : value }));
    setRequestKey("");
    setError("");
  };
  const checkStatus = useCallback(() => setCheckAttempt((value) => value + 1), []);
  useEffect(() => {
    if (!purchase || phase !== "status") return undefined;
    let active = true;
    let timer;
    let attempts = 0;
    setChecking(true);
    const tick = async () => {
      attempts += 1;
      try {
        const { data } = await api.get("/certificates/" + purchase.certificateId + "/status", accessConfig(purchase));
        if (!active) return;
        setStatus(data);
        setError("");
        if (data.paid && ["sent", "failed"].includes(data.emailDelivery)) {
          setChecking(false);
          return;
        }
      } catch (err) {
        if (!active) return;
        setError(err.message || "Не удалось проверить оплату");
      }
      if (!active) return;
      if (attempts >= 20) { setChecking(false); return; }
      timer = window.setTimeout(tick, 3000);
    };
    tick();
    return () => { active = false; window.clearTimeout(timer); };
  }, [purchase, phase, checkAttempt]);
  const startPayment = async () => {
    if (inFlight.current || !config.enabled) return;
    if (!purchase) {
      const invalid = validateCertificateBuyer(fields);
      if (invalid) { setError(invalid); return; }
      if (!turnstile.isSatisfied) { setError("Пройдите проверку защиты"); return; }
    }
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      let current = purchase;
      const key = requestKey || crypto.randomUUID();
      setRequestKey(key);
      // Save before POST too: a lost response must not create a second purchase.
      saveCertificateCheckout({ denomination, fields, requestKey: key, purchase: current });
      if (!current) {
        const { data } = await api.post("/certificates/purchase", {
          ...fields, denomination, turnstileToken: turnstile.token,
        }, { headers: { "Idempotency-Key": key } });
        current = data;
        if (!current?.certificateId || !current?.certificateToken) throw new Error("Не получены данные доступа к сертификату");
        setPurchase(current);
        saveCertificateCheckout({ denomination, fields, requestKey: key, purchase: current });
      }
      const { data } = await api.post("/certificates/" + current.certificateId + "/payment", {}, accessConfig(current));
      const payUrl = new URL(data.pay_url);
      if (payUrl.protocol !== "https:" || payUrl.username || payUrl.password) throw new Error("Некорректная ссылка на оплату");
      markCertificatePayment();
      window.location.assign(payUrl.href);
    } catch (err) {
      turnstile.reset();
      setError(err.message || "Не удалось перейти к оплате");
      setBusy(false);
    } finally { inFlight.current = false; }
  };
  const startNewPurchase = () => {
    if (busy) return;
    clearCertificateCheckout();
    setFields(emptyCertificateBuyer());
    setPurchase(null); setRequestKey(""); setStatus(null); setError(""); setPhase("offer");
  };
  return {
    denomination, setDenomination, fields, updateField, purchase, phase, setPhase, config,
    busy, error, status, checking, checkStatus, startPayment, startNewPurchase, turnstile,
  };
};
