import { useMemo, useState, useRef, useEffect,useLayoutEffect  } from "react";

const LAYOUTS = [
  { value: "grid-basic", label: "Квадраты (как Instagram)" },
  { value: "grid-rowspan", label: "Ряды с крупными 2×2" },
  { value: "masonry", label: "Как Pinterest" },
  { value: "grid-metro", label: "Мозаика (разные ширины/высоты)" },
];

const makeItems = (count = 48) => Array.from({ length: count }, (_, i) => ({ id: i + 1 }));

function useCellVars(ref, getCols) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const apply = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = el.clientWidth || 0;
        const cols = getCols(w);
        const cellPx = Math.floor(w / Math.max(1, cols)) + "px";

        const cs = getComputedStyle(el);
        const prevCols = cs.getPropertyValue("--cols").trim();
        const prevCell = cs.getPropertyValue("--cell").trim();

        if (prevCols !== String(cols)) el.style.setProperty("--cols", String(cols));
        if (prevCell !== cellPx)      el.style.setProperty("--cell", cellPx);
      });
    };

    const ro = new ResizeObserver(apply);
    ro.observe(el, { box: "border-box" }); // безопаснее для сеток
    apply();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [ref, getCols]);
}

export default function WorksGallery() {
  const [layout, setLayout] = useState(LAYOUTS[0].value);
  const [modalItem, setModalItem] = useState(null);
  const items = useMemo(() => makeItems(48), []);

  // === режим 2: первые крупные идут сразу с начала ===
  const isBig = (id) => id === 2 || ((id - 2) % 11 === 0);

  const basicRef = useRef(null);
  const rowspanRef = useRef(null);
  const masonryRef = useRef(null);
  const metroRef = useRef(null);

  // 1 и 2: 5→4→3→2 колонок
  useCellVars(basicRef,  (w) => (w >= 1280 ? 5 : w >= 1024 ? 4 : w >= 768 ? 3 : 2));
  useCellVars(rowspanRef,(w) => (w >= 1280 ? 5 : w >= 1024 ? 4 : w >= 768 ? 3 : 2));
  // 3: Pinterest крупнее
  useCellVars(masonryRef,(w) => (w >= 1280 ? 4 : w >= 1024 ? 3 : w >= 640 ? 2 : 1));
  // 4: Метро
  useCellVars(metroRef,  (w) => (w >= 1024 ? 4 : w >= 768 ? 3 : 2));

  // разная высота для Pinterest
  const masonryHeight = (id) => {
    const pool = [220, 260, 300, 360, 420, 500];
    return pool[(id * 13) % pool.length];
  };

  // мини-описания (2 слова)
  const captions = ["Патронус","Машина","Описание изображения","Алексей, привет","Патронусы","Свежий лук"];
  const captionFor = (id) => captions[id % captions.length];

  // модалка: закрытие по Esc и блокировка скролла
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setModalItem(null);
    if (modalItem) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [modalItem]);

  const openModal = (it) => setModalItem(it);
  const closeModal = () => setModalItem(null);

  return (
    <div className="works-gallery">
      <div className="wg-controls">
        <label className="wg-select">
          <span>Вид:</span>
          <select value={layout} onChange={(e) => setLayout(e.target.value)}>
            {LAYOUTS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* 1. Квадраты */}
      {layout === "grid-basic" && (
        <div className="wg-grid grid-basic" ref={basicRef}>
          {items.map((it) => (
            <div
              key={it.id}
              className="wg-item square"
              role="button"
              tabIndex={0}
              onClick={() => openModal(it)}
            >
              <div className="inner">
                {/* <img src="..." alt="" /> */}
                <div className="ph">#{it.id}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Квадраты + 2×2 сразу сверху */}
      {layout === "grid-rowspan" && (
        <div className="wg-grid grid-rowspan" ref={rowspanRef}>
          {items.map((it) => (
            <div
              key={it.id}
              className={`wg-item ${isBig(it.id) ? "big" : ""}`}
              role="button"
              tabIndex={0}
              onClick={() => openModal(it)}
            >
              <div className="inner">
                {/* <img src="..." alt="" /> */}
                <div className="ph">#{it.id}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Pinterest (gap 5px) */}
      {layout === "masonry" && (
        <div className="wg-masonry" ref={masonryRef}>
          {items.map((it) => (
            <div key={it.id} className="wg-masonry-item">
              <div
                className="wg-item"
                style={{ height: `${masonryHeight(it.id)}px` }}
                role="button"
                tabIndex={0}
                onClick={() => openModal(it)}
              >
                <div className="inner">
                  {/* <img src="..." alt="" /> */}
                  <div className="ph">#{it.id}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Метро-мозаика */}
      {layout === "grid-metro" && (
        <div className="wg-grid grid-metro" ref={metroRef}>
          {items.map((it) => {
            const a = (it.id * 11) % 8;
            const cls = a === 0 ? "w2 h2" : a === 3 ? "w2" : a === 5 ? "h2" : "";
            return (
              <div
                key={it.id}
                className={`wg-item ${cls}`}
                role="button"
                tabIndex={0}
                onClick={() => openModal(it)}
              >
                <div className="inner">
                  {/* <img src="..." alt="" /> */}
                  <div className="ph">#{it.id}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Модалка */}
      {modalItem && (
        <div className="wg-modal" onClick={closeModal}>
          <div className="wg-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="wg-modal-close" onClick={closeModal} aria-label="Закрыть">✕</button>
            <div className="wg-modal-media">
              {/* <img src="..." alt="" /> */}
              <div className="ph">#{modalItem.id}</div>
            </div>
            <div className="wg-modal-caption">{captionFor(modalItem.id)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
