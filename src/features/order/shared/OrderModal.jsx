import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const OrderModal = ({ children, className = "", closeLabel = "Закрыть окно", label, labelledBy, onClose, returnFocusTo }) => {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const returnFocusToRef = useRef(returnFocusTo);
  onCloseRef.current = onClose;
  returnFocusToRef.current = returnFocusTo;

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = [...dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR)]
        .filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
      const requestedFocus = returnFocusToRef.current;
      const focusTarget = requestedFocus?.isConnected ? requestedFocus : previousFocus;
      if (focusTarget?.isConnected) focusTarget.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <div className="modalOverlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className={`modalContent${className ? ` ${className}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
        onClick={(event) => event.stopPropagation()}
      >
        <button ref={closeRef} type="button" className="modalClose" aria-label={closeLabel} onClick={onClose}>
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
            <path d="M16.5 0.5L0.5 16.5M16.5 16.5L0.5 0.5" stroke="#433F3C" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
};

export default OrderModal;
