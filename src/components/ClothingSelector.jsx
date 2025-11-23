import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ReactComponent as CheckIcon } from "../images/Vector.svg";
import api from '../api';
import { buildImgSrc } from '../utils/url';
import hoodieImg from '../images/hoodie.jpg';
import switshotImg from '../images/switshot.jpg';
import tshirtImg from '../images/tshirt.jpg';
import { useOrder } from "../context/OrderContext";

// helper: обводка для белого цвета
const isWhite = (c = "") => {
  const v = String(c).trim().toLowerCase();
  return v === "#fff" || v === "#ffffff" || v === "white" || v === "rgb(255,255,255)";
};

// Нормализация подписи варианта начёса из БД
const normalizeInner = (s) => {
  if (!s) return null;
  const x = String(s).trim().toLowerCase().replaceAll("ё", "е").replace(/\s+/g, " ");
  if (x.includes("с начес")) return "с начёсом";
  if (x.includes("без начес")) return "без начёса";
  return null;
};

// "Худи (с начёсом)" -> { base: "Худи", inner: "с начёсом" }
const parseTypeLabel = (raw) => {
  const str = String(raw ?? "").trim();
  const m = str.match(/^(.*?)(?:\s*\(([^)]+)\))?\s*$/);
  const base = (m?.[1] ?? "").trim();
  const inner = normalizeInner(m?.[2]);
  return { base, inner };
};

// уникальность по ключу
const uniqBy = (arr, keyFn) => {
  const map = new Map();
  for (const item of arr) {
    const k = keyFn(item);
    if (!map.has(k)) map.set(k, item);
  }
  return Array.from(map.values());
};

const INNER_ORDER = { "с начёсом": 1, "без начёса": 2 };

const sizeColumns = [
  "Размер",
  "Ширина под проймой",
  "Длина по переду",
  "Длина плеча",
  "Длина рукава",
];

const sizeCharts = {
  hoodie: {
    title: "худи",
    image: hoodieImg,
    rows: [
      ["XS", "63", "73", "20,5", "58,5"],
      ["S", "65", "75", "21", "59,5"],
      ["M", "67", "77", "21,5", "60"],
      ["L", "69", "78", "22", "60,5"],
      ["XL", "71", "79", "22,5", "61"],
      ["XXL", "73", "80", "23", "61,5"],
    ],
  },
  svitshot: {
    title: "свитшот",
    image: switshotImg,
    rows: [
      ["XS", "63", "71", "22", "58,5"],
      ["S", "65", "73", "22,5", "59,5"],
      ["M", "67", "75", "23", "60"],
      ["L", "69", "77", "23,5", "60,5"],
      ["XL", "71", "78", "24", "61"],
      ["XXL", "73", "79", "24,5", "61,5"],
    ],
  },
  tshirt: {
    title: "футболка",
    image: tshirtImg,
    rows: [
      ["XS", "54", "67", "17", "24"],
      ["S", "56", "69", "17,5", "24,5"],
      ["M", "58", "73", "18", "25"],
      ["L", "60", "75", "18,5", "25,5"],
      ["XL", "62", "77", "19", "26"],
      ["XXL", "64", "79", "19,5", "26,5"],
    ],
  },
  default: {
    title: "izdelie",
    image: tshirtImg,
    rows: [
      ["XS", "54", "67", "17", "24"],
      ["S", "56", "69", "17,5", "24,5"],
      ["M", "58", "73", "18", "25"],
      ["L", "60", "75", "18,5", "25,5"],
      ["XL", "62", "77", "19", "26"],
      ["XXL", "64", "79", "19,5", "26,5"],
    ],
  },
};

const detectChartKey = (base) => {
  const raw = String(base || "").toLowerCase();
  const translit = raw
    .replace(/х/g, "h")
    .replace(/уди/g, "udi")
    .replace(/худи/g, "hudi")
    .replace(/свитшот/g, "svitshot")
    .replace(/свит/g, "svit")
    .replace(/футбол/g, "futbol");
  const name = `${raw} ${translit}`;
  if (name.includes("hudi") || name.includes("hoodie")) return "hoodie";
  if (name.includes("svitshot") || name.includes("sweatshirt")) return "svitshot";
  if (name.includes("t-shirt") || name.includes("tshirt") || name.includes("tee") || name.includes("futbol")) return "tshirt";
  return "default";
};

const ClothingSelector = () => {
  const navigate = useNavigate();
  const { order, setClothing } = useOrder();
  const { clothing } = order;

  const [inventory, setInventory] = useState([]);
  const [selectedClothing, setSelectedClothing] = useState(clothing.type || "");
  const [selectedInnerType, setSelectedInnerType] = useState(clothing.innerType || "");
  const [selectedColor, setSelectedColor] = useState(clothing.color || "");
  const [selectedSize, setSelectedSize] = useState(clothing.size || "");
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [chartKey, setChartKey] = useState(() => detectChartKey(clothing.type));

  const activeChart = sizeCharts[chartKey] || sizeCharts[detectChartKey(selectedClothing)] || sizeCharts.default;

  const typedInventory = useMemo(
    () => inventory.map((i) => ({ ...i, parsed: parseTypeLabel(i.productType) })),
    [inventory]
  );

  const availableBaseTypes = useMemo(() => {
    const list = uniqBy(
      typedInventory.map((i) => i.parsed.base).filter(Boolean),
      (x) => x
    );
    return list;
  }, [typedInventory]);

  const presentInnerOptions = useMemo(() => {
    const set = new Set(
      typedInventory
        .filter((i) => i.parsed.base === selectedClothing)
        .map((i) => i.parsed.inner)
        .filter(Boolean)
    );
    return Array.from(set).sort(
      (a, b) => (INNER_ORDER[a] ?? 99) - (INNER_ORDER[b] ?? 99)
    );
  }, [typedInventory, selectedClothing]);

  const needsInner = presentInnerOptions.length > 0;

  const filteredByType = useMemo(() => {
    return typedInventory.filter((i) => {
      if (i.parsed.base !== selectedClothing) return false;
      if (!needsInner) return true;
      if (!selectedInnerType) return false;
      return i.parsed.inner === selectedInnerType;
    });
  }, [typedInventory, selectedClothing, needsInner, selectedInnerType]);

  const availableColorOptions = useMemo(() => {
    const byName = new Map();
    filteredByType.forEach((i) => {
      if (!byName.has(i.color)) {
        byName.set(i.color, {
          label: i.color,
          code: i.colorCode || i.color || "#CCCCCC",
        });
      }
    });
    return Array.from(byName.values());
  }, [filteredByType]);

  const availableSizes = useMemo(() => {
    const list = filteredByType
      .filter((i) => i.color === selectedColor)
      .reduce((acc, i) => {
        if (!acc.includes(i.size)) acc.push(i.size);
        return acc;
      }, []);
    return list;
  }, [filteredByType, selectedColor]);

  const canProceed = Boolean(
    selectedClothing &&
      selectedColor &&
      selectedSize &&
      (!needsInner || selectedInnerType)
  );

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const { data } = await api.get('/inventory');
        const cleaned = (Array.isArray(data) ? data : []).filter((item) => {
          const qty = Number(item?.quantity ?? 0);
          return Number.isFinite(qty) && qty > 0;
        });
        setInventory(cleaned);
        const firstBase = parseTypeLabel(cleaned?.[0]?.productType)?.base || "";
        if (!clothing.type && firstBase) setSelectedClothing(firstBase);
      } catch (err) {
        console.error("Error loading inventory:", err);
      }
    };
    fetchInventory();
  }, [clothing.type]);

  useEffect(() => {
    setChartKey(detectChartKey(selectedClothing));
  }, [selectedClothing]);

  useEffect(() => {
    if (!selectedClothing) return;
    setSelectedColor("");
    setSelectedSize("");

    if (presentInnerOptions.length > 0) {
      if (!presentInnerOptions.includes(selectedInnerType)) {
        setSelectedInnerType(presentInnerOptions[0]);
      }
    } else {
      if (selectedInnerType) setSelectedInnerType("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClothing, presentInnerOptions]);

  useEffect(() => {
    if (needsInner && !selectedInnerType) {
      setSelectedColor("");
      setSelectedSize("");
      return;
    }

    if (availableColorOptions.length > 0) {
      const hasSelected = availableColorOptions.some((o) => o.label === selectedColor);
      if (!hasSelected) {
        setSelectedColor(availableColorOptions[0].label);
        setSelectedSize("");
      }
    } else {
      if (selectedColor) setSelectedColor("");
      if (selectedSize) setSelectedSize("");
    }
  }, [selectedInnerType, needsInner, availableColorOptions, selectedColor, selectedSize]);

  useEffect(() => {
    if (selectedSize && !availableSizes.includes(selectedSize)) {
      setSelectedSize("");
    }
  }, [availableSizes, selectedSize]);

  useEffect(() => {
    // keep shared order state in sync to survive route changes/back navigation
    const isSame =
      (clothing.type || "") === (selectedClothing || "") &&
      (clothing.innerType || "") === (selectedInnerType || "") &&
      (clothing.color || "") === (selectedColor || "") &&
      (clothing.size || "") === (selectedSize || "");
    if (isSame) return;
    setClothing({
      type: selectedClothing,
      innerType: selectedInnerType,
      color: selectedColor,
      size: selectedSize,
    });
  }, [
    selectedClothing,
    selectedInnerType,
    selectedColor,
    selectedSize,
    setClothing,
    clothing.type,
    clothing.innerType,
    clothing.color,
    clothing.size,
  ]);

  const handleConfirm = () => {
    if (!canProceed) return;
    navigate("/embroidery");
  };

  const previewItem = useMemo(() => {
    return filteredByType.find((item) => item.color === selectedColor) || filteredByType[0];
  }, [filteredByType, selectedColor]);

  return (
    <>
      <div className="blockClothingSelector">
        <div className="clothing-block">
          <div className="image-wrapper">
            <div className="image-frame">
              {previewItem ? (
                <img
                  src={buildImgSrc(previewItem?.imageUrl)}
                  alt={selectedClothing}
                  className="clotheImage"
                  loading="lazy"
                />
              ) : (
                <img src="placeholder.png" alt="Выберите одежду" className="clotheImage" />
              )}
            </div>
          </div>
        </div>

        <div className="blockSelection">
          <div className="selectorGroup">
            <p className="title">ТИП ИЗДЕЛИЯ:</p>

            <div className="selectorType">
              {availableBaseTypes.length === 0 && (
                <div className="muted">Нет доступных товаров</div>
              )}
              {availableBaseTypes.map((base) => (
                <React.Fragment key={base}>
                  <label className="selectorType__item">
                    <input
                      type="radio"
                      name="clothing"
                      value={base}
                      checked={selectedClothing === base}
                      onChange={(e) => setSelectedClothing(e.target.value)}
                    />
                    <span className="selectorType__custom">
                      <CheckIcon className="selectorType__check" />
                    </span>
                    {base}
                  </label>

                  {selectedClothing === base && needsInner && (
                    <div className="selectorType selectorType--inner" key={`${base}-inner`}>
                      {presentInnerOptions.map((inner) => (
                        <label className="selectorType__item" key={inner}>
                          <input
                            type="radio"
                            name="innerType"
                            value={inner}
                            checked={selectedInnerType === inner}
                            onChange={(e) => setSelectedInnerType(e.target.value)}
                          />
                          <span className="selectorType__custom">
                            <CheckIcon className="selectorType__check" />
                          </span>
                          {inner}
                        </label>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="selectorGroup">
            <p className="title">ЦВЕТ:</p>
            <div className="colorSelector">
              {!needsInner || selectedInnerType ? (
                availableColorOptions.length > 0 ? (
                  availableColorOptions.map((opt) => (
                    <div
                      key={opt.label}
                      className={`colorSquare ${selectedColor === opt.label ? "active" : ""}`}
                      style={{
                        backgroundColor: opt.code,
                        border: isWhite(opt.code) ? "1px solid currentColor" : undefined,
                      }}
                      title={opt.label}
                      onClick={() => setSelectedColor(opt.label)}
                    />
                  ))
                ) : (
                  <div className="muted">Нет доступных цветов</div>
                )
              ) : (
                <div className="muted">Сначала выберите вариант («с начёсом» / «без начёса»)</div>
              )}
            </div>
          </div>

          <div className="selectorGroup">
            <p className="title">РАЗМЕР:</p>
            <div className="sizeSelector">
              {sizes.map((size) => {
                const isAvailable = availableSizes.includes(size);
                return (
                  <label
                    className={`sizeSelector__item ${isAvailable ? "" : "is-disabled"}`}
                    key={size}
                    title={isAvailable ? "" : "Нет в наличии"}
                  >
                    <input
                      type="radio"
                      name="size"
                      value={size}
                      checked={selectedSize === size}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      disabled={!isAvailable}
                    />
                    <span className="sizeSelector__box">{size}</span>
                  </label>
                );
              })}
            </div>

            <div
              className="tableSize"
              onClick={() => {
                setChartKey(detectChartKey(selectedClothing));
                setShowSizeModal(true);
              }}
            >
              таблица размеров
            </div>
          </div>

          <button className="confirmButton" onClick={handleConfirm} disabled={!canProceed}>
            ПЕРЕЙТИ К ВЫШИВКЕ
          </button>
        </div>
      </div>

      {showSizeModal && (
        <div className="modalOverlay" onClick={() => setShowSizeModal(false)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modalClose"
              aria-label="Закрыть таблицу размеров"
              onClick={() => setShowSizeModal(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
                viewBox="0 0 17 17"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M16.5 0.5L0.5 16.5M16.5 16.5L0.5 0.5"
                  stroke="#433F3C"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className="modalHeader">
              <button className={chartKey === "svitshot" ? "active" : ""} onClick={() => setChartKey("svitshot")}>свитшот</button>
              <button className={chartKey === "hoodie" ? "active" : ""} onClick={() => setChartKey("hoodie")}>худи</button>
              <button className={chartKey === "tshirt" ? "active" : ""} onClick={() => setChartKey("tshirt")}>футболка</button>
            </div>

            <div className="sizeTable sizeTableGrid">
              <div className="sizeTable__table">
                <table>
                  <thead>
                    <tr>
                      {sizeColumns.map((col) => <th key={col}>{col}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {(activeChart.rows || []).map((row) => (
                      <tr key={row[0]}>
                        {row.map((cell, idx) => <td key={`${row[0]}-${idx}`}>{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="sizeTable__illustration">
                <div className="sizeTable__placeholder">
                  <img className="sizeTable__img" src={activeChart.image} alt={activeChart.title} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClothingSelector;
