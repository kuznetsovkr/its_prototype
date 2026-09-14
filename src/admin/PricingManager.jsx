import { useEffect, useMemo, useState } from "react";

const EMBROIDERY_ROWS = [
  { key: "Patronus", label: "Патронусы" },
  { key: "Car", label: "Автомобиль" },
  { key: "petFace", label: "Мордочка питомца" },
];

const SIZE_GUIDES = [
  { value: "", label: "Без таблицы" },
  { value: "tshirt", label: "Футболка" },
  { value: "hoodie", label: "Худи" },
  { value: "svitshot", label: "Свитшот" },
];

const onlyDigits = (value) => String(value ?? "").replace(/\D/g, "");

const cloneConfig = (config) => config ? {
  ...config,
  types: (config.types || []).map((type) => ({
    ...type,
    prices: { ...type.prices },
    package: { ...type.package },
  })),
  additional: { ...config.additional },
} : null;

const PricingManager = ({ config, isSaving, onSave }) => {
  const [draft, setDraft] = useState(() => cloneConfig(config));

  useEffect(() => {
    setDraft(cloneConfig(config));
  }, [config]);

  const isValid = useMemo(() => {
    if (!draft || !Array.isArray(draft.types) || draft.types.length === 0) return false;
    const validTypes = draft.types.every((type) => {
      const prices = EMBROIDERY_ROWS.map(({ key }) => Number(type.prices?.[key]));
      const packageValues = ["width", "height", "length", "weight"]
        .map((key) => Number(type.package?.[key]));
      return prices.every((value) => Number.isInteger(value) && value > 0) &&
        packageValues.every((value) => Number.isInteger(value) && value > 0) &&
        Number.isInteger(Number(type.displayOrder)) && Number(type.displayOrder) > 0 &&
        Number.isInteger(Number(type.patronusLimit)) &&
        Number(type.patronusLimit) >= 1 && Number(type.patronusLimit) <= 5;
    });
    const additionalPrices = [
      Number(draft.additional?.Patronus),
      Number(draft.additional?.petFace),
    ];
    return validTypes && additionalPrices.every((value) => Number.isInteger(value) && value >= 0);
  }, [draft]);

  const updateType = (id, updater) => {
    setDraft((current) => ({
      ...current,
      types: current.types.map((type) => type.id === id ? updater(type) : type),
    }));
  };

  const changePrice = (id, embroideryType, value) => {
    updateType(id, (type) => ({
      ...type,
      prices: { ...type.prices, [embroideryType]: onlyDigits(value) },
    }));
  };

  const changeProfile = (id, field, value) => {
    updateType(id, (type) => ({ ...type, [field]: value }));
  };

  const changePackage = (id, field, value) => {
    updateType(id, (type) => ({
      ...type,
      package: { ...type.package, [field]: onlyDigits(value) },
    }));
  };

  const changeAdditionalPrice = (type, value) => {
    setDraft((current) => ({
      ...current,
      additional: { ...current.additional, [type]: onlyDigits(value) },
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    if (!isValid || isSaving) return;
    onSave({
      types: draft.types.map((type) => ({
        id: Number(type.id),
        displayOrder: Number(type.displayOrder),
        sizeGuideKey: type.sizeGuideKey || null,
        patronusLimit: Number(type.patronusLimit),
        prices: Object.fromEntries(
          EMBROIDERY_ROWS.map(({ key }) => [key, Number(type.prices[key])])
        ),
        package: Object.fromEntries(
          ["width", "height", "length", "weight"].map((key) => [key, Number(type.package[key])])
        ),
      })),
      additional: {
        Patronus: Number(draft.additional.Patronus),
        petFace: Number(draft.additional.petFace),
      },
    });
  };

  return (
    <section className="admin-panel admin-pricing" aria-labelledby="admin-pricing-title">
      <div className="admin-panel__heading">
        <div>
          <p className="admin-panel__eyebrow">02 · единый прайс</p>
          <h2 id="admin-pricing-title">Цены и параметры</h2>
        </div>
        <p>Цены, таблицы размеров и параметры отправлений задаются отдельно для каждого изделия.</p>
      </div>

      {!draft ? (
        <div className="admin-loading" role="status">Загружаем цены…</div>
      ) : draft.types.length === 0 ? (
        <div className="admin-loading">Сначала добавьте хотя бы один тип изделия.</div>
      ) : (
        <form onSubmit={submit}>
          <div className="admin-pricing__grid">
            {EMBROIDERY_ROWS.map((row) => (
              <article className="admin-price-card" key={row.key}>
                <div className="admin-price-card__heading">
                  <h3>{row.label}</h3>
                  <span>готовое изделие</span>
                </div>
                <div className="admin-price-card__fields">
                  {draft.types.map((type) => (
                    <label className="field" key={type.id}>
                      <span className="label">{type.name}, ₽</span>
                      <input
                        className="input"
                        type="number"
                        min="1"
                        max="1000000"
                        step="1"
                        value={type.prices?.[row.key] ?? ""}
                        onChange={(event) => changePrice(type.id, row.key, event.target.value)}
                      />
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="admin-pricing__profiles">
            <div className="admin-pricing__profiles-heading">
              <h3>Профили изделий</h3>
              <p>Вес указывается в граммах, остальные габариты — в сантиметрах.</p>
            </div>
            <div className="admin-profile-grid">
              {draft.types.map((type) => (
                <article className="admin-profile-card" key={type.id}>
                  <div className="admin-profile-card__heading">
                    <div><h4>{type.name}</h4><span>{type.code}</span></div>
                  </div>
                  <div className="admin-profile-card__fields">
                    <label className="field">
                      <span className="label">Порядок</span>
                      <input className="input" type="number" min="1" max="10000" value={type.displayOrder ?? ""}
                        onChange={(event) => changeProfile(type.id, "displayOrder", onlyDigits(event.target.value))} />
                    </label>
                    <label className="field">
                      <span className="label">Таблица размеров</span>
                      <select className="select" value={type.sizeGuideKey || ""}
                        onChange={(event) => changeProfile(type.id, "sizeGuideKey", event.target.value)}>
                        {SIZE_GUIDES.map((guide) => <option key={guide.value} value={guide.value}>{guide.label}</option>)}
                      </select>
                    </label>
                    <label className="field">
                      <span className="label">Макс. патронусов</span>
                      <input className="input" type="number" min="1" max="5" value={type.patronusLimit ?? ""}
                        onChange={(event) => changeProfile(type.id, "patronusLimit", onlyDigits(event.target.value))} />
                    </label>
                    {[
                      ["width", "Ширина, см"],
                      ["height", "Высота, см"],
                      ["length", "Длина, см"],
                      ["weight", "Вес, г"],
                    ].map(([field, label]) => (
                      <label className="field" key={field}>
                        <span className="label">{label}</span>
                        <input className="input" type="number" min="1" step="1" value={type.package?.[field] ?? ""}
                          onChange={(event) => changePackage(type.id, field, event.target.value)} />
                      </label>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="admin-pricing__extras">
            <div>
              <h3>Доплаты за количество</h3>
              <p>Начисляются за каждую единицу после первой.</p>
            </div>
            <label className="field">
              <span className="label">Доп. патронус, ₽</span>
              <input className="input" type="number" min="0" max="1000000" step="1"
                value={draft.additional.Patronus}
                onChange={(event) => changeAdditionalPrice("Patronus", event.target.value)} />
            </label>
            <label className="field">
              <span className="label">Доп. портрет, ₽</span>
              <input className="input" type="number" min="0" max="1000000" step="1"
                value={draft.additional.petFace}
                onChange={(event) => changeAdditionalPrice("petFace", event.target.value)} />
            </label>
          </div>

          <div className="admin-pricing__actions">
            <button className="btn btn-primary" type="submit" disabled={!isValid || isSaving}>
              {isSaving ? "Сохраняем…" : "Сохранить цены и параметры"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

export default PricingManager;
