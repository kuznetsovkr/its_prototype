import { useEffect, useRef, useState } from "react";

const SCRIPT_SELECTOR = "script[data-its-turnstile]";
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let turnstileScriptPromise = null;

const loadTurnstileScript = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Turnstile requires a browser"));
  }
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (turnstileScriptPromise) return turnstileScriptPromise;

  turnstileScriptPromise = new Promise((resolve, reject) => {
    let script = document.querySelector(SCRIPT_SELECTOR);
    const handleLoad = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("Turnstile API is unavailable"));
    };
    const handleError = () => {
      script?.remove();
      turnstileScriptPromise = null;
      reject(new Error("Turnstile script failed to load"));
    };

    if (!script) {
      script = document.createElement("script");
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.dataset.itsTurnstile = "true";
      document.head.appendChild(script);
    }
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
  });

  return turnstileScriptPromise;
};

const ShieldIcon = ({ verified = false }) => (
  <svg viewBox="0 0 32 36" aria-hidden="true">
    <path d="M16 2 28 7v9c0 8.1-4.7 14.2-12 18-7.3-3.8-12-9.9-12-18V7l12-5Z" />
    {verified && <path d="m10.5 17.5 3.7 3.7 7.7-8" />}
  </svg>
);

const TurnstileWidget = ({ siteKey, action, disabled, resetSignal, onTokenChange }) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const callbackRef = useRef(onTokenChange);
  const previousResetSignal = useRef(resetSignal);
  const [renderAttempt, setRenderAttempt] = useState(0);
  const [widgetStatus, setWidgetStatus] = useState("loading");

  useEffect(() => {
    callbackRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    let cancelled = false;
    setWidgetStatus("loading");
    callbackRef.current("");

    loadTurnstileScript()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) return;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          appearance: "always",
          execution: "render",
          size: "flexible",
          theme: "light",
          callback: (token) => {
            callbackRef.current(token);
            setWidgetStatus("verified");
          },
          "before-interactive-callback": () => setWidgetStatus("interactive"),
          "expired-callback": () => {
            callbackRef.current("");
            setWidgetStatus("expired");
          },
          "timeout-callback": () => {
            callbackRef.current("");
            setWidgetStatus("expired");
          },
          "error-callback": () => {
            callbackRef.current("");
            setWidgetStatus("error");
          },
        });
        setWidgetStatus((current) => current === "loading" ? "checking" : current);
      })
      .catch(() => {
        if (!cancelled) setWidgetStatus("error");
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current != null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [action, renderAttempt, siteKey]);

  useEffect(() => {
    if (previousResetSignal.current === resetSignal) return;
    previousResetSignal.current = resetSignal;
    callbackRef.current("");
    if (widgetIdRef.current != null && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      setWidgetStatus("checking");
    }
  }, [resetSignal]);

  const verified = widgetStatus === "verified";
  const statusLabel = {
    loading: "Подключаем защиту…",
    checking: "Выполняем проверку…",
    interactive: "Подтвердите проверку",
    verified: "Проверка пройдена",
    expired: "Проверка устарела — пройдите её снова",
    error: "Не удалось загрузить проверку",
  }[widgetStatus];

  return (
    <div
      className={`recipientOrderForm__turnstile is-${widgetStatus}`}
      aria-disabled={disabled}
      data-testid="turnstile-panel"
    >
      <div className="recipientOrderForm__turnstileHeader">
        <span className="recipientOrderForm__turnstileShield">
          <ShieldIcon verified={verified} />
        </span>
        <span className="recipientOrderForm__turnstileCopy" aria-live="polite">
          <strong>Защита от автоматических заявок</strong>
          <small>{statusLabel}</small>
        </span>
        {widgetStatus === "error" && (
          <button
            type="button"
            className="recipientOrderForm__turnstileRetry"
            onClick={() => setRenderAttempt((current) => current + 1)}
            disabled={disabled}
          >
            Повторить
          </button>
        )}
      </div>
      <div className="recipientOrderForm__turnstileWidget" ref={containerRef} />
    </div>
  );
};

const TurnstilePanel = ({ challenge, disabled }) => {
  if (challenge.status === "disabled") return null;

  if (challenge.status === "loading" || challenge.status === "error") {
    return (
      <div
        className={`recipientOrderForm__turnstile is-config-${challenge.status}`}
        data-testid="turnstile-panel"
      >
        <div className="recipientOrderForm__turnstileHeader">
          <span className="recipientOrderForm__turnstileShield">
            <ShieldIcon />
          </span>
          <span className="recipientOrderForm__turnstileCopy" aria-live="polite">
            <strong>Защита от автоматических заявок</strong>
            <small>
              {challenge.status === "loading"
                ? "Подключаем проверку…"
                : "Не удалось получить настройки защиты"}
            </small>
          </span>
          {challenge.status === "error" && (
            <button
              type="button"
              className="recipientOrderForm__turnstileRetry"
              onClick={challenge.retryConfig}
              disabled={disabled}
            >
              Повторить
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <TurnstileWidget
      siteKey={challenge.siteKey}
      action={challenge.action}
      disabled={disabled}
      resetSignal={challenge.resetSignal}
      onTokenChange={challenge.setToken}
    />
  );
};

export default TurnstilePanel;
