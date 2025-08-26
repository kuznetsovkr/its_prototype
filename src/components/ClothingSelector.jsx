import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ReactComponent as CheckIcon } from "../images/Vector.svg";

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

// порядок показа вариантов
const INNER_ORDER = { "с начёсом": 1, "без начёса": 2 };

const ClothingSelector = () => {
  const navigate = useNavigate();

  const [inventory, setInventory] = useState([]);
  const [selectedClothing, setSelectedClothing] = useState("");      // базовый тип
  const [selectedInnerType, setSelectedInnerType] = useState("");     // вариант начёса
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [gender, setGender] = useState("men");

  // расширяем инвентарь полем parsed
  const typedInventory = useMemo(
    () => inventory.map((i) => ({ ...i, parsed: parseTypeLabel(i.productType) })),
    [inventory]
  );

  // базовые типы (без приписок)
  const availableBaseTypes = useMemo(() => {
    const list = uniqBy(
      typedInventory.map((i) => i.parsed.base).filter(Boolean),
      (x) => x
    );
    return list;
  }, [typedInventory]);

  // какие варианты «начёса» доступны для выбранного базового типа
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

  // склад под текущие фильтры base + inner (если нужен)
  const filteredByType = useMemo(() => {
    return typedInventory.filter((i) => {
      if (i.parsed.base !== selectedClothing) return false;
      if (!needsInner) return true;
      if (!selectedInnerType) return false;
      return i.parsed.inner === selectedInnerType;
    });
  }, [typedInventory, selectedClothing, needsInner, selectedInnerType]);

  // цвета (с кодом) под текущий выбор
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

  // размеры под текущий выбор
  const availableSizes = useMemo(() => {
    const list = filteredByType
      .filter((i) => i.color === selectedColor)
      .reduce((acc, i) => {
        if (!acc.includes(i.size)) acc.push(i.size);
        return acc;
      }, []);
    return list;
  }, [filteredByType, selectedColor]);

  // можно ли перейти далее
  const canProceed = Boolean(
    selectedClothing &&
      selectedColor &&
      selectedSize &&
      (!needsInner || selectedInnerType)
  );

  // загрузка склада
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/api/inventory");

        // берём только позиции с положительным остатком
        const cleaned = (Array.isArray(data) ? data : []).filter((item) => {
          const qty = Number(item?.quantity ?? 0);
          return Number.isFinite(qty) && qty > 0;
        });

        setInventory(cleaned);

        // дефолтный базовый тип — из ОЧИЩЕННОГО списка
        const firstBase = parseTypeLabel(cleaned?.[0]?.productType)?.base || "";
        if (firstBase) setSelectedClothing(firstBase);
      } catch (err) {
        console.error("Ошибка загрузки склада:", err);
      }
    };
    fetchInventory();
  }, []);


  // АВТО-ВЫБОР варианта начёса при смене базового типа или составе вариантов
  useEffect(() => {
    if (!selectedClothing) return;

    // сбрасываем цвет/размер при смене типа
    setSelectedColor("");
    setSelectedSize("");

    if (presentInnerOptions.length > 0) {
      // если текущий вариант невалиден — подставим первый доступный
      if (!presentInnerOptions.includes(selectedInnerType)) {
        setSelectedInnerType(presentInnerOptions[0]);
      }
    } else {
      // у типа нет вариантов — очищаем inner
      if (selectedInnerType) setSelectedInnerType("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClothing, presentInnerOptions]);

  // Подстановка ПЕРВОГО ДОСТУПНОГО ЦВЕТА при смене варианта начёса (и вообще, когда список цветов обновился)
  useEffect(() => {
    // если нужен выбор варианта, но он ещё не выбран — ждём (но выше мы уже автосетим)
    if (needsInner && !selectedInnerType) {
      setSelectedColor("");
      setSelectedSize("");
      return;
    }

    if (availableColorOptions.length > 0) {
      // если текущий цвет невалиден — подставим первый
      if (!availableColorOptions.some((o) => o.label === selectedColor)) {
        setSelectedColor(availableColorOptions[0].label);
        setSelectedSize("");
      }
    } else {
      if (selectedColor) setSelectedColor("");
      if (selectedSize) setSelectedSize("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInnerType, needsInner, availableColorOptions]);

  // если текущий размер пропал — сбрасываем
  useEffect(() => {
    if (selectedSize && !availableSizes.includes(selectedSize)) {
      setSelectedSize("");
    }
  }, [availableSizes, selectedSize]);

  const handleConfirm = () => {
    if (!canProceed) return;
    navigate("/embroidery", {
      state: { selectedClothing, selectedSize, selectedColor, selectedInnerType },
    });
  };

  // картинка превью
  const previewItem = useMemo(() => {
    return filteredByType.find((item) => item.color === selectedColor) || filteredByType[0];
  }, [filteredByType, selectedColor]);

  return (
    <>
      <div className="blockClothingSelector">
        {/* Левая часть: изображение товара */}
        <div className="clothing-block">
          <div className="image-wrapper">
            {previewItem ? (
              <img
                src={`http://localhost:5000${previewItem.imageUrl || "placeholder.png"}`}
                alt={selectedClothing}
                className="clotheImage"
              />
            ) : (
              <img src="placeholder.png" alt="Выберите одежду" className="clotheImage" />
            )}
          </div>
        </div>

        {/* Правая часть */}
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

          {/* Размер */}
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

            <div className="tableSize" onClick={() => setShowSizeModal(true)}>
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
            <div className="modalHeader">
              <button className={gender === "men" ? "active" : ""} onClick={() => setGender("men")}>
                Мужчины
              </button>
              <button className={gender === "women" ? "active" : ""} onClick={() => setGender("women")}>
                Женщины
              </button>
            </div>

            <div className="sizeTable">
              {gender === "men" ? (
                <table>
                  <thead>
                    <tr><th>Размер</th><th>Грудь</th><th>Талия</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>S</td><td>88–92</td><td>76–80</td></tr>
                    <tr><td>M</td><td>92–96</td><td>80–84</td></tr>
                    <tr><td>L</td><td>96–100</td><td>84–88</td></tr>
                  </tbody>
                </table>
              ) : (
                <table>
                  <thead>
                    <tr><th>Размер</th><th>Грудь</th><th>Талия</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>S</td><td>84–88</td><td>64–68</td></tr>
                    <tr><td>M</td><td>88–92</td><td>68–72</td></tr>
                    <tr><td>L</td><td>92–96</td><td>72–76</td></tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClothingSelector;
