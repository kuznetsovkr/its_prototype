import { useMemo, useState, useRef, useEffect } from "react";

const LAYOUTS = [
  { value: "grid-basic", label: "Квадраты (как Instagram)" },
  { value: "grid-rowspan", label: "Ряды с крупными 2×2" },
  { value: "masonry", label: "Как Pinterest" },
  { value: "grid-metro", label: "Мозаика (разные ширины/высоты)" },
];

const makeItems = (count = 42) => Array.from({ length: count }, (_, i) => ({ id: i + 1 }));

// Хук: вычисляем ширину ячейки и кол-во колонок (для идеальных квадратов и крупных плиток)
function useCellVars(ref, getCols) {
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const apply = () => {
      const w = el.clientWidth || 0;
      const cols = getCols(w);
      const cell = Math.floor(w / cols); // px на одну клетку (без gap, т.к. его нет)
      el.style.setProperty("--cols", cols);
      el.style.setProperty("--cell", `${cell}px`);
    };

    const ro = new ResizeObserver(apply);
    ro.observe(el);
    apply();

    return () => ro.disconnect();
  }, [ref, getCols]);
}

export default function WorksGallery() {
  const [layout, setLayout] = useState(LAYOUTS[0].value);
  const items = useMemo(() => makeItems(48), []);

  const isBig = (id) => ((id * 7) % 11) === 0; // для режима 2: помечаем некоторые как 2×2

  // более “жирные” высоты для Pinterest
  const masonryHeight = (id) => {
    const pool = [220, 260, 300, 360, 420, 500];
    return pool[(id * 13) % pool.length]; // px
  };

  // refs для контейнеров, где нужны вычисления
  const basicRef = useRef(null);
  const rowspanRef = useRef(null);
  const masonryRef = useRef(null);
  const metroRef = useRef(null);

  // 1) и 2): 5→4→3→2 колонок
  useCellVars(basicRef,  (w) => (w >= 1280 ? 5 : w >= 1024 ? 4 : w >= 768 ? 3 : 2));
  useCellVars(rowspanRef,(w) => (w >= 1280 ? 5 : w >= 1024 ? 4 : w >= 768 ? 3 : 2));

  // 3) Pinterest: кол-во колонок поменьше (крупнее карточки)
  useCellVars(masonryRef,(w) => (w >= 1280 ? 4 : w >= 1024 ? 3 : w >= 640 ? 2 : 1));

  // 4) метро: крупнее базовая клетка (4→3→2)
  useCellVars(metroRef,  (w) => (w >= 1024 ? 4 : w >= 768 ? 3 : 2));

  return (
    <div className="works-gallery">
      <div className="wg-controls">
        <label className="wg-select">
          <span>Вид:</span>
          <select value={layout} onChange={(e) => setLayout(e.target.value)}>
            {LAYOUTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* 1. Квадраты ~20% ширины */}
      {layout === "grid-basic" && (
        <div className="wg-grid grid-basic" ref={basicRef}>
          {items.map((it) => (
            <div key={it.id} className="wg-item square">
              {/* <img src="..." alt="" /> */}
              <div className="ph">#{it.id}</div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Квадраты + крупные 2×2 */}
      {layout === "grid-rowspan" && (
        <div className="wg-grid grid-rowspan" ref={rowspanRef}>
          {items.map((it) => (
            <div key={it.id} className={`wg-item ${isBig(it.id) ? "big" : ""}`}>
              {/* <img src="..." alt="" /> */}
              <div className="ph">#{it.id}</div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Pinterest */}
      {layout === "masonry" && (
        <div className="wg-masonry" ref={masonryRef}>
          {items.map((it) => (
            <div key={it.id} className="wg-masonry-item">
              <div className="wg-item" style={{ height: `${masonryHeight(it.id)}px` }}>
                {/* <img src="..." alt="" /> */}
                <div className="ph">#{it.id}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Метро-мозаика (крупнее клетки) */}
      {layout === "grid-metro" && (
        <div className="wg-grid grid-metro" ref={metroRef}>
          {items.map((it) => {
            const a = (it.id * 11) % 8;
            const cls = a === 0 ? "w2 h2" : a === 3 ? "w2" : a === 5 ? "h2" : "";
            return (
              <div key={it.id} className={`wg-item ${cls}`}>
                {/* <img src="..." alt="" /> */}
                <div className="ph">#{it.id}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
