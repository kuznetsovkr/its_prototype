import { useEffect, useMemo, useState } from "react";

const EMBROIDERY_ROWS = [
  { key: "Patronus", label: "Патронусы" },
  { key: "Car", label: "Автомобиль" },
  { key: "petFace", label: "Мордочка питомца" },
];

const GARMENTS = [
  { key: "tshirt", label: "Футболка" },
  { key: "svitshot", label: "Свитшот" },
  { key: "hoodie", label: "Худи" },
];

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

const PricingManager = ({ config, isSaving, onSave }) => {
  const [draft, setDraft] = useState(config);

  useEffect(() => {
    setDraft(config);
  }, [config]);

  const isValid = useMemo(() => {
    if (!draft) return false;
    const basePrices = EMBROIDERY_ROWS.flatMap(({ key }) =>
      GARMENTS.map(({ key: garment }) => Number(draft.matrix?.[key]?.[garment]))
    );
    const additionalPrices = [
      Number(draft.additional?.Patronus),
      Number(draft.additional?.petFace),
    ];
    return basePrices.every((value) => Number.isInteger(value) && value > 0) &&
      additionalPrices.every((value) => Number.isInteger(value) && value >= 0);
  }, [draft]);

  const changeMatrixPrice = (type, garment, value) => {
    setDraft((current) => ({
      ...current,
      matrix: {
        ...current.matrix,
        [type]: { ...current.matrix[type], [garment]: onlyDigits(value) },
      },
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
      matrix: Object.fromEntries(EMBROIDERY_ROWS.map(({ key }) => [
        key,
        Object.fromEntries(GARMENTS.map(({ key: garment }) => [
          garment,
          Number(draft.matrix[key][garment]),
        ])),
      ])),
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
          <h2 id="admin-pricing-title">цены</h2>
        </div>
        <p>Все суммы заказа берутся отсюда. Изменение применяется сразу ко всем новым расчётам и заказам.</p>
      </div>

      {!draft ? (
        <div className="admin-loading" role="status">Загружаем цены…</div>
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
                  {GARMENTS.map((garment) => (
                    <label className="field" key={garment.key}>
                      <span className="label">{garment.label}, ₽</span>
                      <input
                        className="input"
                        type="number"
                        min="1"
                        max="1000000"
                        step="1"
                        value={draft.matrix[row.key][garment.key]}
                        onChange={(event) => changeMatrixPrice(row.key, garment.key, event.target.value)}
                      />
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="admin-pricing__extras">
            <div>
              <h3>Доплаты за количество</h3>
              <p>Начисляются за каждую единицу после первой.</p>
            </div>
            <label className="field">
              <span className="label">Доп. патронус, ₽</span>
              <input
                className="input"
                type="number"
                min="0"
                max="1000000"
                step="1"
                value={draft.additional.Patronus}
                onChange={(event) => changeAdditionalPrice("Patronus", event.target.value)}
              />
            </label>
            <label className="field">
              <span className="label">Доп. портрет, ₽</span>
              <input
                className="input"
                type="number"
                min="0"
                max="1000000"
                step="1"
                value={draft.additional.petFace}
                onChange={(event) => changeAdditionalPrice("petFace", event.target.value)}
              />
            </label>
          </div>

          <div className="admin-pricing__actions">
            <button className="btn btn-primary" type="submit" disabled={!isValid || isSaving}>
              {isSaving ? "Сохраняем…" : "Сохранить все цены"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

export default PricingManager;
