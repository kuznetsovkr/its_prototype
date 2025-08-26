import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const HEX_RE = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

export default function ColorSelect({
  colors = [],                 // [{name, code}]
  valueName = "",
  valueCode = "",
  onChange,                    // (colorObj) -> void
  onAddColor,                  // async ({name, code}) -> colorObj
  placeholder = "Выберите цвет",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("#");
  const [menuRect, setMenuRect] = useState({ top: 0, left: 0, width: 0, flip: false });

  const wrapRef = useRef(null);      // обёртка поля (внутри формы)
  const triggerRef = useRef(null);   // кнопка-триггер
  const popRef = useRef(null);       // КОНТЕЙНЕР ПОПАПА (в портале)
  const colorInputRef = useRef(null);

  // закрывать по клику вне ТРИГГЕРА ИЛИ ПОПАПА
  useEffect(() => {
    const onDocDown = (e) => {
      const w = wrapRef.current;
      const p = popRef.current;
      if (!open) return;
      if (w?.contains(e.target) || p?.contains(e.target)) return; // клик внутри — игнор
      setOpen(false);
      setAdding(false);
    };
    document.addEventListener("mousedown", onDocDown, true);
    return () => document.removeEventListener("mousedown", onDocDown, true);
  }, [open]);

  // позиционирование попапа
  const place = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const popHeight = 360;
    const spaceBelow = vh - r.bottom;
    const flip = spaceBelow < popHeight + 12;
    const top = flip ? Math.max(8, r.top - popHeight - 8) : r.bottom + 8;
    const left = Math.min(r.left, vw - r.width - 8);
    setMenuRect({ top, left, width: r.width, flip });
  };

  useEffect(() => {
    if (!open) return;
    place();
    const onScroll = () => place();
    const onResize = () => place();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return colors;
    return colors.filter(
      c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [colors, search]);

  const current = useMemo(() => {
    return (valueName || valueCode) ? { name: valueName, code: valueCode } : null;
  }, [valueName, valueCode]);

  const handlePick = (c) => {
    onChange?.(c);
    setOpen(false);
    setAdding(false);
  };

  const normHex = (v) => {
    let x = v.trim().toUpperCase();
    if (!x.startsWith("#")) x = "#" + x;
    return x;
  };

  const canAdd =
    newName.trim().length > 0 &&
    HEX_RE.test(newCode) &&
    !colors.some(c => c.name.toLowerCase() === newName.trim().toLowerCase());

  const addColor = async () => {
    if (!canAdd) return;
    const payload = { name: newName.trim(), code: normHex(newCode) };
    try {
      const colorObj = await onAddColor?.(payload);
      const finalObj = colorObj || payload;
      onChange?.(finalObj);
      // reset
      setAdding(false);
      setNewName("");
      setNewCode("#");
      setSearch("");
      setOpen(false); // закрываем после успешного добавления
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="color-select" ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        className="input color-trigger"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        {current ? (
          <span className="color-chip">
            <span className="swatch" style={{ backgroundColor: current.code }} />
            {current.name}
          </span>
        ) : (
          <span className="placeholder">{placeholder}</span>
        )}
        <span className="chev">▾</span>
      </button>

      {open && createPortal(
        <div
          ref={popRef}
          className="color-portal"
          style={{ position: "fixed", zIndex: 3000, top: menuRect.top, left: menuRect.left}}
        >
          <div className="color-popover is-open" role="listbox" data-flip={menuRect.flip ? "1" : "0"}>
            {!adding && (
                <div className="color-search">
                <input
                    className="input"
                    placeholder="Поиск цвета…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                />
                </div>
            )}

            {!adding && (
              <>
                <div className="color-list">
                  {filtered.map((c) => (
                    <button
                      key={`${c.name}-${c.code}`}
                      type="button"
                      className="color-item"
                      onClick={() => handlePick(c)}
                      title={`${c.name} ${c.code}`}
                    >
                      <span className="swatch" style={{ backgroundColor: c.code }} />
                      <span className="name">{c.name}</span>
                      <span className="code">{c.code}</span>
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <div className="muted" style={{ padding: 8 }}>Ничего не найдено</div>
                  )}
                </div>

                <div className="color-add">
                  <button type="button" className="btn btn-outline" onClick={() => setAdding(true)}>
                    Добавить новый цвет
                  </button>
                </div>
              </>
            )}

            {adding && (
              <div className="color-add-form">
                <input
                  className="input"
                  placeholder="Название (напр. Лаймовый)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <div className="hex-row">
                  <input
                    className="input"
                    placeholder="#HEX (напр. #32CD32)"
                    value={newCode}
                    onChange={(e) => setNewCode(normHex(e.target.value))}
                  />
                  {/* кружок-выбор палитры */}
                  <button
                    type="button"
                    className="swatch-btn"
                    style={{ backgroundColor: HEX_RE.test(newCode) ? newCode : "#ffffff" }}
                    onClick={() => colorInputRef.current?.click()}
                    title="Выбрать цвет"
                  />
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={HEX_RE.test(newCode) ? newCode : "#000000"}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }}
                    tabIndex={-1}
                  />
                </div>

                <div className="color-add-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => { setAdding(false); setNewName(""); setNewCode("#"); }}
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!canAdd}
                    onClick={addColor}
                    title={!HEX_RE.test(newCode) ? "Введите HEX вида #RRGGBB" : undefined}
                  >
                    Добавить
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
