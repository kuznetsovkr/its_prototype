import { useEffect, useState } from "react";
import { getPublicCheckoutConfig } from "./recipientApi";

const disabledConfig = Object.freeze({
  status: "disabled",
  siteKey: "",
  action: "",
});

export const useTurnstileChallenge = ({ disabled = false } = {}) => {
  const [config, setConfig] = useState(disabled ? disabledConfig : {
    status: "loading",
    siteKey: "",
    action: "",
  });
  const [token, setTokenState] = useState("");
  const [resetSignal, setResetSignal] = useState(0);
  const [configAttempt, setConfigAttempt] = useState(0);

  useEffect(() => {
    if (disabled) {
      setConfig(disabledConfig);
      setTokenState("");
      return undefined;
    }

    let active = true;
    setConfig({ status: "loading", siteKey: "", action: "" });
    setTokenState("");

    getPublicCheckoutConfig()
      .then((data) => {
        if (!active) return;
        const turnstile = data?.turnstile;
        if (turnstile?.enabled !== true) {
          setConfig(disabledConfig);
          return;
        }
        const siteKey = typeof turnstile.siteKey === "string" ? turnstile.siteKey.trim() : "";
        const action = typeof turnstile.action === "string" ? turnstile.action.trim() : "";
        if (!siteKey || !action) throw new Error("Incomplete Turnstile configuration");
        setConfig({ status: "ready", siteKey, action });
      })
      .catch(() => {
        if (active) setConfig({ status: "error", siteKey: "", action: "" });
      });

    return () => {
      active = false;
    };
  }, [configAttempt, disabled]);

  const setToken = (value) => {
    const normalized = typeof value === "string" ? value.trim().slice(0, 2048) : "";
    setTokenState(normalized);
  };
  const reset = () => {
    setTokenState("");
    setResetSignal((current) => current + 1);
  };
  const retryConfig = () => setConfigAttempt((current) => current + 1);

  return {
    ...config,
    token,
    resetSignal,
    setToken,
    reset,
    retryConfig,
    isSatisfied: config.status === "disabled" || (config.status === "ready" && Boolean(token)),
    isVisible: config.status !== "disabled",
  };
};
