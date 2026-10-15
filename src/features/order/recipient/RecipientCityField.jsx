import { useEffect, useId, useRef, useState } from "react";
import { normalizeDeliveryCity } from "./deliveryCity";
import { resolveDeliveryCity, suggestDeliveryCities } from "./deliveryCityApi";

const RecipientCityField = ({ city, onChange, disabled, syncing, notice, fixedLabel }) => {
  const id = useId();
  const [query, setQuery] = useState(city?.label || "");
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const requestRef = useRef(null);
  const inputRef = useRef(null);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  useEffect(() => {
    if (city?.label) { setQuery(city.label); setOpen(false); setError(""); }
  }, [city?.label, city?.token]);
  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => {
    if (open && active >= 0) inputRef.current?.parentElement.querySelectorAll('[role="option"]')[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);
  useEffect(() => {
    setActive(-1);
    if (!open || disabled || resolving || query.trim().length < 2 || city) {
      setOptions([]); setLoading(false); setSearched(false); return undefined;
    }
    const controller = new AbortController();
    setLoading(true); setOptions([]); setError(""); setSearched(false);
    const timer = setTimeout(() => {
      suggestDeliveryCities(query.trim(), controller.signal)
        .then(values => { if (!controller.signal.aborted) { setOptions(values); setSearched(true); } })
        .catch(reason => { if (!controller.signal.aborted) { setOptions([]); setError(reason.message || "Не удалось загрузить города"); } })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 350);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [query, open, disabled, resolving, city]);

  const choose = async (option) => {
    requestRef.current?.abort();
    const controller = new AbortController(); requestRef.current = controller;
    setResolving(true); setOpen(false); setError("");
    try {
      const next = normalizeDeliveryCity(await resolveDeliveryCity(option.id, controller.signal));
      if (!next) throw new Error("Не удалось определить город. Выберите другую подсказку");
      if (!controller.signal.aborted && !disabledRef.current) { setQuery(next.label); onChange(next); }
    } catch (reason) {
      if (!controller.signal.aborted) setError(reason.message || "Не удалось выбрать город");
    } finally { if (!controller.signal.aborted) setResolving(false); }
  };
  const onInput = (event) => {
    requestRef.current?.abort(); setResolving(false); setQuery(event.target.value); setOpen(true); setError("");
    if (city || syncing) onChange(null);
  };
  const onKeyDown = (event) => {
    if (event.key === "Escape") { event.preventDefault(); setOpen(false); return; }
    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault(); setOpen(true);
      setActive(index => options.length ? Math.max(0, Math.min(options.length - 1, index + (event.key === "ArrowDown" ? 1 : -1))) : -1);
    }
    if (event.key === "Enter" && open && active >= 0 && options[active]) { event.preventDefault(); choose(options[active]); }
  };
  return (
    <div className="recipientCity" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <label htmlFor={id}>Город получения</label>
      <div className="recipientCity__control">
        <input ref={inputRef} id={id} type="text" role="combobox" autoComplete="off" placeholder="Начните вводить город или населённый пункт"
          value={disabled && fixedLabel ? fixedLabel : query} onChange={onInput} onFocus={() => setOpen(true)} onKeyDown={onKeyDown} disabled={disabled}
          maxLength={120} aria-autocomplete="list" aria-expanded={open && options.length > 0}
          aria-controls={`${id}-list`} aria-activedescendant={open && active >= 0 ? `${id}-option-${active}` : undefined}
          aria-invalid={Boolean(error || (query && !city && !loading && !resolving))} aria-describedby={`${id}-help`}
          aria-busy={loading || resolving || syncing} />
        {open && options.length > 0 && <ul className="recipientCity__options" id={`${id}-list`} role="listbox" aria-label="Населённые пункты">
          {options.map((option, index) => <li key={option.id} id={`${id}-option-${index}`} role="option" aria-selected={index === active}
            className={index === active ? "is-active" : ""} onPointerDown={event => event.preventDefault()}
            onClick={() => choose(option)}>{option.label}</li>)}
        </ul>}
      </div>
      <small className={`recipientDeliveryDetails__hint${error ? " recipientCity__error" : ""}`} id={`${id}-help`} role="status">
        {error || (syncing ? "Проверяем город выбранного ПВЗ…" : resolving ? "Подтверждаем населённый пункт…" : loading ? "Ищем города…"
          : !city && searched && !options.length ? "Ничего не найдено. Уточните название или добавьте регион"
          : disabled && fixedLabel ? "Город зафиксирован в созданном заказе"
          : !city ? "Выберите населённый пункт из подсказок — это определит доступные способы получения"
          : notice || "Карта СДЭК откроется на выбранном городе")}
      </small>
    </div>
  );
};
export default RecipientCityField;
