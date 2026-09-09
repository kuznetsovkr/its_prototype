import { useMemo, useState } from "react";

const HEX_RE = /^#[0-9A-F]{6}$/;

const normalizeHex = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  return normalized.startsWith("#") ? normalized : `#${normalized}`;
};

const formatPrice = (price) => `${Number(price || 0).toLocaleString("ru-RU")} ₽`;

const CatalogManager = ({
  clothingTypes,
  colors,
  usedTypeIds,
  onAddClothingType,
  onDeleteClothingType,
  onAddColor,
}) => {
  const [typeName, setTypeName] = useState("");
  const [typePrice, setTypePrice] = useState("");
  const [colorName, setColorName] = useState("");
  const [colorCode, setColorCode] = useState("#BC5823");
  const [pendingAction, setPendingAction] = useState("");

  const sortedTypes = useMemo(
    () => [...clothingTypes].sort((a, b) => a.name.localeCompare(b.name, "ru")),
    [clothingTypes]
  );
  const sortedColors = useMemo(
    () => [...colors].sort((a, b) => a.name.localeCompare(b.name, "ru")),
    [colors]
  );

  const submitType = async (event) => {
    event.preventDefault();
    const name = typeName.trim();
    const price = Number(typePrice);
    if (!name || !Number.isInteger(price) || price <= 0) return;

    setPendingAction("type");
    try {
      await onAddClothingType({ name, price });
      setTypeName("");
      setTypePrice("");
    } finally {
      setPendingAction("");
    }
  };

  const submitColor = async (event) => {
    event.preventDefault();
    const name = colorName.trim();
    const code = normalizeHex(colorCode);
    if (!name || !HEX_RE.test(code)) return;

    setPendingAction("color");
    try {
      await onAddColor({ name, code });
      setColorName("");
      setColorCode("#BC5823");
    } finally {
      setPendingAction("");
    }
  };

  return (
    <section className="admin-panel admin-catalog" aria-labelledby="admin-catalog-title">
      <div className="admin-panel__heading">
        <div>
          <p className="admin-panel__eyebrow">01 · подготовка каталога</p>
          <h2 id="admin-catalog-title">Справочники</h2>
        </div>
        <p>Сначала добавьте типы одежды и цвета, затем создавайте складские позиции.</p>
      </div>

      <div className="admin-catalog__grid">
        <article className="admin-directory-card">
          <div className="admin-directory-card__heading">
            <h3>Типы одежды</h3>
            <span>{clothingTypes.length}</span>
          </div>

          <form className="admin-directory-form" onSubmit={submitType}>
            <label className="field admin-directory-form__name">
              <span className="label">Название</span>
              <input
                className="input"
                type="text"
                maxLength={120}
                placeholder="Например, худи"
                value={typeName}
                onChange={(event) => setTypeName(event.target.value)}
              />
            </label>
            <label className="field admin-directory-form__value">
              <span className="label">Цена, ₽</span>
              <input
                className="input"
                type="number"
                min="1"
                step="1"
                placeholder="5000"
                value={typePrice}
                onChange={(event) => setTypePrice(event.target.value.replace(/\D/g, ""))}
              />
            </label>
            <button
              className="btn btn-primary admin-directory-form__submit"
              type="submit"
              disabled={pendingAction === "type" || !typeName.trim() || Number(typePrice) <= 0}
            >
              {pendingAction === "type" ? "Сохраняем…" : "Добавить тип"}
            </button>
          </form>

          <div className="admin-directory-list" aria-live="polite">
            {sortedTypes.length ? sortedTypes.map((type) => {
              const isUsed = usedTypeIds.has(String(type.id));
              return (
                <div className="admin-directory-item" key={type.id}>
                  <div>
                    <strong>{type.name}</strong>
                    <span>{formatPrice(type.price)}</span>
                  </div>
                  <button
                    className="admin-directory-item__remove"
                    type="button"
                    disabled={isUsed}
                    title={isUsed ? "Тип используется в складских позициях" : "Удалить тип"}
                    aria-label={`Удалить тип «${type.name}»`}
                    onClick={() => onDeleteClothingType(type)}
                  >
                    ×
                  </button>
                </div>
              );
            }) : (
              <p className="admin-directory-empty">Типов пока нет — добавьте первый.</p>
            )}
          </div>
        </article>

        <article className="admin-directory-card">
          <div className="admin-directory-card__heading">
            <h3>Цвета</h3>
            <span>{colors.length}</span>
          </div>

          <form className="admin-directory-form admin-directory-form--color" onSubmit={submitColor}>
            <label className="field admin-directory-form__name">
              <span className="label">Название</span>
              <input
                className="input"
                type="text"
                maxLength={80}
                placeholder="Например, графитовый"
                value={colorName}
                onChange={(event) => setColorName(event.target.value)}
              />
            </label>
            <label className="field admin-directory-form__value">
              <span className="label">HEX</span>
              <span className="admin-color-value">
                <input
                  className="input"
                  type="text"
                  maxLength={7}
                  placeholder="#5C5C5C"
                  value={colorCode}
                  onChange={(event) => setColorCode(normalizeHex(event.target.value))}
                />
                <input
                  className="admin-color-value__picker"
                  type="color"
                  value={HEX_RE.test(normalizeHex(colorCode)) ? normalizeHex(colorCode) : "#BC5823"}
                  onChange={(event) => setColorCode(event.target.value.toUpperCase())}
                  aria-label="Выбрать цвет"
                />
              </span>
            </label>
            <button
              className="btn btn-primary admin-directory-form__submit"
              type="submit"
              disabled={pendingAction === "color" || !colorName.trim() || !HEX_RE.test(normalizeHex(colorCode))}
            >
              {pendingAction === "color" ? "Сохраняем…" : "Добавить цвет"}
            </button>
          </form>

          <div className="admin-color-list" aria-live="polite">
            {sortedColors.length ? sortedColors.map((color) => (
              <button
                className="admin-color-chip"
                type="button"
                key={`${color.name}-${color.code}`}
                title="Подставить цвет в форму"
                onClick={() => {
                  setColorName(color.name);
                  setColorCode(color.code);
                }}
              >
                <span style={{ backgroundColor: color.code }} />
                <strong>{color.name}</strong>
                <small>{color.code}</small>
              </button>
            )) : (
              <p className="admin-directory-empty">Цветов пока нет — добавьте первый.</p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
};

export default CatalogManager;
