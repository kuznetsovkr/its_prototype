import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ReactComponent as CheckIcon } from "../images/Vector.svg";
import api from '../api';
import { buildImgSrc } from '../utils/url';
import hoodieImg from '../images/hoodie.jpg';
import switshotImg from '../images/switshot.jpg';
import tshirtImg from '../images/tshirt.jpg';
import figmaTshirtImg from '../images/order/tshirt-black.png';
import orderBackMobile from '../images/order/order-back-mobile.svg';
import { useOrder } from "../context/OrderContext";
import { IS_DEMO_MODE } from "../config/demoMode";
import { DEMO_INVENTORY } from "../mocks/demoData";

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

const hasStock = (item) => {
  const quantity = Number(item?.quantity ?? 0);
  return Number.isFinite(quantity) && quantity > 0;
};

const normalizeKey = (value) => String(value || "").trim().toLowerCase();

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

const TYPE_ORDER = { tshirt: 1, hoodie: 2, svitshot: 3, default: 99 };
const CORE_SIZES = ["XS", "S", "M", "L", "XL"];
const COLOR_ORDER = new Map([
  ["белый", 1],
  ["white", 1],
  ["чёрный", 2],
  ["черный", 2],
  ["black", 2],
  ["серый", 3],
  ["gray", 3],
  ["grey", 3],
  ["красный", 4],
  ["red", 4],
  ["синий", 5],
  ["blue", 5],
]);

const ClothingSelector = () => {
  const navigate = useNavigate();
  const { order, setClothing } = useOrder();
  const { clothing } = order;

  const [inventory, setInventory] = useState([]);
  const [clothingTypes, setClothingTypes] = useState([]);
  const [colorCatalog, setColorCatalog] = useState([]);
  const [inventoryLoaded, setInventoryLoaded] = useState(false);
  const [selectedClothing, setSelectedClothing] = useState(clothing.type || "");
  const [selectedInnerType, setSelectedInnerType] = useState(clothing.innerType || "");
  const [selectedColor, setSelectedColor] = useState(clothing.color || "");
  const [selectedSize, setSelectedSize] = useState(clothing.size || "");
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [chartKey, setChartKey] = useState(() => detectChartKey(clothing.type));

  const activeChart = sizeCharts[chartKey] || sizeCharts[detectChartKey(selectedClothing)] || sizeCharts.default;

  const typedInventory = useMemo(
    () => inventory.map((i) => ({ ...i, parsed: parseTypeLabel(i.productType) })),
    [inventory]
  );

  const typedInStockInventory = useMemo(
    () => typedInventory.filter(hasStock),
    [typedInventory]
  );

  const sizeOptions = useMemo(() => {
    const supportsXXL =
      normalizeKey(selectedSize) === "xxl" ||
      typedInventory.some((item) => normalizeKey(item.size) === "xxl");
    return supportsXXL ? [...CORE_SIZES, "XXL"] : CORE_SIZES;
  }, [typedInventory, selectedSize]);

  const baseTypeOptions = useMemo(() => {
    const catalogTypes = clothingTypes
      .map((item) => parseTypeLabel(item?.name).base)
      .filter(Boolean);
    const inventoryTypes = typedInventory.map((item) => item.parsed.base).filter(Boolean);
    const list = uniqBy([...inventoryTypes, ...catalogTypes], normalizeKey);

    return list
      .sort((a, b) => TYPE_ORDER[detectChartKey(a)] - TYPE_ORDER[detectChartKey(b)])
      .map((label) => ({
        label,
        isAvailable: typedInStockInventory.some(
          (item) => normalizeKey(item.parsed.base) === normalizeKey(label)
        ),
      }));
  }, [clothingTypes, typedInventory, typedInStockInventory]);

  const presentInnerOptions = useMemo(() => {
    const set = new Set(
      typedInStockInventory
        .filter(
          (i) => normalizeKey(i.parsed.base) === normalizeKey(selectedClothing)
        )
        .map((i) => i.parsed.inner)
        .filter(Boolean)
    );
    return Array.from(set).sort(
      (a, b) => (INNER_ORDER[a] ?? 99) - (INNER_ORDER[b] ?? 99)
    );
  }, [typedInStockInventory, selectedClothing]);

  const needsInner = presentInnerOptions.length > 0;

  const filteredByType = useMemo(() => {
    return typedInventory.filter((i) => {
      if (normalizeKey(i.parsed.base) !== normalizeKey(selectedClothing)) return false;
      if (!needsInner) return true;
      if (!selectedInnerType) return false;
      return i.parsed.inner === selectedInnerType;
    });
  }, [typedInventory, selectedClothing, needsInner, selectedInnerType]);

  const colorOptions = useMemo(() => {
    const byName = new Map();

    const addColor = (label, code, preferLabel = false) => {
      const normalizedLabel = String(label || "").trim();
      if (!normalizedLabel) return;
      const key = normalizedLabel.toLowerCase();
      const current = byName.get(key);
      byName.set(key, {
        label: preferLabel ? normalizedLabel : current?.label || normalizedLabel,
        code: code || current?.code || "#CCCCCC",
      });
    };

    colorCatalog.forEach((color) => addColor(color?.name, color?.code));
    filteredByType.forEach((i) => {
      addColor(i.color, i.colorCode, true);
    });

    return Array.from(byName.values())
      .map((option) => ({
        ...option,
        isAvailable: filteredByType.some(
          (item) => hasStock(item) && normalizeKey(item.color) === normalizeKey(option.label)
        ),
      }))
      .sort(
        (a, b) =>
          (COLOR_ORDER.get(normalizeKey(a.label)) ?? 99) -
          (COLOR_ORDER.get(normalizeKey(b.label)) ?? 99)
      );
  }, [colorCatalog, filteredByType]);

  const availableSizes = useMemo(() => {
    const list = filteredByType
      .filter(
        (i) => hasStock(i) && normalizeKey(i.color) === normalizeKey(selectedColor)
      )
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
      (!needsInner || selectedInnerType) &&
      filteredByType.some(
        (item) =>
          hasStock(item) &&
          normalizeKey(item.color) === normalizeKey(selectedColor) &&
          item.size === selectedSize
      )
  );

  useEffect(() => {
    let cancelled = false;

    const fetchInventory = async () => {
      if (IS_DEMO_MODE) {
        const demoTypes = uniqBy(
          DEMO_INVENTORY.map((item) => ({ name: parseTypeLabel(item.productType).base }))
            .filter((item) => item.name),
          (item) => item.name
        );
        const demoColors = uniqBy(
          DEMO_INVENTORY.map((item) => ({
            name: item.color,
            code: item.colorCode || item.color || "#CCCCCC",
          })).filter((item) => item.name),
          (item) => item.name
        );

        if (cancelled) return;
        setInventory(DEMO_INVENTORY);
        setClothingTypes(demoTypes);
        setColorCatalog(demoColors);
        setInventoryLoaded(true);
        return;
      }

      const [inventoryResult, typesResult, colorsResult] = await Promise.allSettled([
        api.get('/inventory'),
        api.get('/clothing-types'),
        api.get('/colors'),
      ]);

      if (cancelled) return;

      if (
        inventoryResult.status === "fulfilled" &&
        Array.isArray(inventoryResult.value.data)
      ) {
        setInventory(inventoryResult.value.data);
        setInventoryLoaded(true);
      } else {
        console.error(
          "Error loading inventory:",
          inventoryResult.status === "rejected"
            ? inventoryResult.reason
            : "Unexpected response format"
        );
      }

      if (typesResult.status === "fulfilled") {
        setClothingTypes(Array.isArray(typesResult.value.data) ? typesResult.value.data : []);
      }

      if (colorsResult.status === "fulfilled") {
        setColorCatalog(Array.isArray(colorsResult.value.data) ? colorsResult.value.data : []);
      }

    };

    fetchInventory();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setChartKey(detectChartKey(selectedClothing));
  }, [selectedClothing]);

  useEffect(() => {
    if (!inventoryLoaded) return;

    const firstAvailableType = baseTypeOptions.find((option) => option.isAvailable)?.label || "";
    const selectedTypeIsAvailable = baseTypeOptions.some(
      (option) =>
        normalizeKey(option.label) === normalizeKey(selectedClothing) && option.isAvailable
    );

    if (!selectedTypeIsAvailable && selectedClothing !== firstAvailableType) {
      setSelectedClothing(firstAvailableType);
      setSelectedInnerType("");
      setSelectedColor("");
      setSelectedSize("");
    }
  }, [inventoryLoaded, baseTypeOptions, selectedClothing]);

  useEffect(() => {
    if (!inventoryLoaded) return;
    if (!selectedClothing) return;

    if (presentInnerOptions.length > 0) {
      if (!presentInnerOptions.includes(selectedInnerType)) {
        setSelectedInnerType(presentInnerOptions[0]);
        setSelectedColor("");
        setSelectedSize("");
      }
    } else {
      if (selectedInnerType) setSelectedInnerType("");
    }
  }, [inventoryLoaded, selectedClothing, presentInnerOptions, selectedInnerType]);

  useEffect(() => {
    if (!inventoryLoaded) return;
    if (needsInner && !selectedInnerType) {
      setSelectedColor("");
      setSelectedSize("");
      return;
    }

    const availableColorOptions = colorOptions.filter((option) => option.isAvailable);

    if (availableColorOptions.length > 0) {
      const hasSelected = availableColorOptions.some(
        (o) => normalizeKey(o.label) === normalizeKey(selectedColor)
      );
      if (!hasSelected) {
        setSelectedColor(availableColorOptions[0].label);
        setSelectedSize("");
      }
    } else {
      if (selectedColor) setSelectedColor("");
      if (selectedSize) setSelectedSize("");
    }
  }, [inventoryLoaded, selectedInnerType, needsInner, colorOptions, selectedColor, selectedSize]);

  useEffect(() => {
    if (!inventoryLoaded) return;
    if (selectedSize && !availableSizes.includes(selectedSize)) {
      setSelectedSize("");
    }
  }, [inventoryLoaded, availableSizes, selectedSize]);

  const handleSelectClothing = (value) => {
    setSelectedClothing(value);
    setSelectedInnerType("");
    setSelectedColor("");
    setSelectedSize("");
  };

  const handleSelectInnerType = (value) => {
    setSelectedInnerType(value);
    setSelectedColor("");
    setSelectedSize("");
  };

  const handleSelectColor = (value) => {
    setSelectedColor(value);
    setSelectedSize("");
  };

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
    const exact = filteredByType.find(
      (item) =>
        hasStock(item) && normalizeKey(item.color) === normalizeKey(selectedColor)
    );
    if (exact) return exact;

    if (!selectedClothing) return null;

    const sameBase = typedInventory.filter((item) => item.parsed.base === selectedClothing);
    if (selectedInnerType) {
      const sameInner = sameBase.find((item) => item.parsed.inner === selectedInnerType);
      if (sameInner) return sameInner;
    }

    return sameBase[0] || null;
  }, [filteredByType, selectedColor, selectedClothing, selectedInnerType, typedInventory]);

  const previewSrc = useMemo(() => buildImgSrc(previewItem?.imageUrl), [previewItem?.imageUrl]);
  const previewAlt = selectedClothing || "Одежда";
  const [stablePreview, setStablePreview] = useState({ src: "", alt: "" });

  useEffect(() => {
    if (!previewSrc) {
      if (stablePreview.src) {
        setStablePreview({ src: "", alt: "" });
      }
      return undefined;
    }

    if (previewSrc === stablePreview.src) {
      if (stablePreview.alt !== previewAlt) {
        setStablePreview((prev) => ({ ...prev, alt: previewAlt }));
      }
      return undefined;
    }

    let cancelled = false;
    const nextPreview = { src: previewSrc, alt: previewAlt };
    const img = new Image();

    const applyNext = () => {
      if (cancelled) return;
      setStablePreview(nextPreview);
    };

    img.onload = applyNext;
    img.onerror = applyNext;
    img.src = previewSrc;

    return () => {
      cancelled = true;
    };
  }, [previewSrc, previewAlt, stablePreview.src, stablePreview.alt]);

  const displayPreviewSrc = stablePreview.src || figmaTshirtImg;
  const displayPreviewAlt = stablePreview.src
    ? stablePreview.alt || previewAlt
    : "Чёрная футболка";
  const rawPrice = previewItem?.price;
  const parsedPrice = Number(rawPrice);
  const hasInventoryPrice =
    rawPrice !== null &&
    rawPrice !== undefined &&
    rawPrice !== "" &&
    Number.isFinite(parsedPrice);
  const displayPrice = hasInventoryPrice ? parsedPrice : 3000;

  return (
    <>
      <div className="blockClothingSelector">
        <div className="clothing-block">
          <button
            type="button"
            className="clothingSelectorMobile__arrow"
            onClick={() => navigate(-1)}
            aria-label="Вернуться назад"
          >
            <img src={orderBackMobile} alt="" aria-hidden="true" />
          </button>
          <h1 className="orderStepTitle" id="order-clothing-title">заказ изделия</h1>
          <div className="image-wrapper">
            <div className="image-frame">
              <div className="image-stack" aria-live="polite">
                <img
                  src={displayPreviewSrc}
                  alt={displayPreviewAlt}
                  className="clotheImage"
                  draggable="false"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="clothingControls">
          <div className="blockSelection">
            <div className="selectorGroup selectorGroup--type">
              <p className="title">Выберите изделие</p>

              <div className="selectorType">
                {baseTypeOptions.length === 0 && (
                  <div className="muted">Нет доступных товаров</div>
                )}
                {baseTypeOptions.map((option) => (
                  <label
                    className={`selectorType__item ${normalizeKey(selectedClothing) === normalizeKey(option.label) ? "active" : ""} ${option.isAvailable ? "" : "is-disabled"}`}
                    key={option.label}
                    title={option.isAvailable ? "" : "Нет в наличии"}
                  >
                    <input
                      type="radio"
                      name="clothing"
                      value={option.label}
                      checked={normalizeKey(selectedClothing) === normalizeKey(option.label)}
                      onChange={(e) => handleSelectClothing(e.target.value)}
                      disabled={!option.isAvailable}
                    />
                    <span className="selectorType__custom">
                      <CheckIcon className="selectorType__check" />
                    </span>
                    {option.label}
                  </label>
                ))}
              </div>

              {needsInner && (
                <div className="selectorType selectorType--inner">
                  {presentInnerOptions.map((inner) => (
                    <label
                      className={`selectorType__item ${selectedInnerType === inner ? "active" : ""}`}
                      key={inner}
                    >
                      <input
                        type="radio"
                        name="innerType"
                        value={inner}
                        checked={selectedInnerType === inner}
                        onChange={(e) => handleSelectInnerType(e.target.value)}
                      />
                      <span className="selectorType__custom">
                        <CheckIcon className="selectorType__check" />
                      </span>
                      {inner}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="selectorGroup selectorGroup--color">
              <p className="title">Цвет</p>
              <div className="colorSelector">
                {!needsInner || selectedInnerType ? (
                  colorOptions.length > 0 ? (
                    colorOptions.map((opt) => (
                      <button
                        type="button"
                        key={opt.label}
                        className={`colorSquare ${normalizeKey(selectedColor) === normalizeKey(opt.label) && opt.isAvailable ? "active" : ""} ${opt.isAvailable ? "" : "is-disabled"}`}
                        style={{
                          backgroundColor: opt.isAvailable ? opt.code : "#e4e4e4",
                          border:
                            opt.isAvailable &&
                            isWhite(opt.code) &&
                            normalizeKey(selectedColor) !== normalizeKey(opt.label)
                              ? "1px solid #b4b4b4"
                              : undefined,
                        }}
                        title={opt.isAvailable ? opt.label : `${opt.label}: нет в наличии`}
                        aria-label={opt.isAvailable ? opt.label : `${opt.label}: нет в наличии`}
                        onClick={() => handleSelectColor(opt.label)}
                        disabled={!opt.isAvailable}
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

            <div className="selectorGroup selectorGroup--size">
              <div className="selectorGroup__heading">
                <p className="title">Размер</p>
                <div
                  className="tableSize"
                  onClick={() => {
                    setChartKey(detectChartKey(selectedClothing));
                    setShowSizeModal(true);
                  }}
                >
                  Таблица размеров
                </div>
              </div>
              <div
                className={`sizeSelector${sizeOptions.length > CORE_SIZES.length ? " sizeSelector--six" : ""}`}
              >
                {sizeOptions.map((size) => {
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
            </div>

            <p className="clothingPrice">Цена: {displayPrice} руб</p>
          </div>

          <div className="orderNavigation">
            <button
              type="button"
              className="orderActionButton orderActionButton--back"
              onClick={() => navigate(-1)}
            >
              назад
            </button>
            <button
              type="button"
              className="orderActionButton orderActionButton--next"
              onClick={handleConfirm}
              disabled={!canProceed}
            >
              далее
            </button>
          </div>
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
