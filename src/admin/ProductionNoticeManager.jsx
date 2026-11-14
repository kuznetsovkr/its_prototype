import { useEffect, useState } from "react";
import api from "../api";
import ProductionNoticeCard from "../features/productionNotice/ProductionNoticeCard";
import { useProductionNotice } from "../features/productionNotice/ProductionNoticeContext";

export default function ProductionNoticeManager() {
  const [draft, setDraft] = useState(null);
  const [automaticDates, setAutomaticDates] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reload, setReload] = useState(0);
  const { refresh } = useProductionNotice();
  const apply = (data) => { setDraft(data.settings); setAutomaticDates(data.automaticDates); };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api.get("/admin/production-notice", { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) apply(data); })
      .catch((failure) => { if (!controller.signal.aborted) setError(failure.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reload]);

  const update = (key, value) => { setDraft((old) => ({ ...old, [key]: value })); setSuccess(""); };
  const save = async (event) => {
    event.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      const { data } = await api.put("/admin/production-notice", draft);
      apply(data);
      setSuccess("Сроки сохранены. Новое уведомление появится у посетителей не позднее чем через минуту.");
      refresh();
    } catch (failure) { setError(failure.message || "Не удалось сохранить сроки"); }
    finally { setSaving(false); }
  };
  const text = draft?.mode === "auto" ? draft.autoTemplate.replaceAll("{dates}", automaticDates) : draft?.manualText;
  return <section className="admin-panel admin-production-notice" aria-labelledby="admin-production-notice-title">
    <div className="admin-panel__heading">
      <div><p className="admin-panel__eyebrow">уведомление на сайте</p><h2 id="admin-production-notice-title">Сроки изготовления</h2></div>
      <button className="btn btn-outline" type="button" disabled={loading || saving} onClick={() => setReload((n) => n + 1)}>Обновить сроки</button>
    </div>
    {loading && <p role="status">Загружаем настройки…</p>}
    {error && <p role="alert">{error}</p>}
    {success && <p role="status">{success}</p>}
    {!loading && draft && <div className="admin-production-notice__layout">
      <form onSubmit={save} className="admin-production-notice__form">
        <fieldset disabled={saving}>
          <label className="admin-production-notice__toggle"><input type="checkbox" checked={draft.enabled} onChange={(e) => update("enabled", e.target.checked)} />Показывать сроки на сайте и перед оформлением</label>
          <label className="field"><span className="label">Режим сроков</span><select className="select" value={draft.mode} onChange={(e) => update("mode", e.target.value)}>
            <option value="manual">Ручной текст</option><option value="auto">Автоматический расчёт</option>
          </select></label>
          <p>{draft.mode === "manual" ? "Ручной текст не меняется автоматически. Не забывайте обновлять даты." : "По времени Красноярска: заказы 1–14-го → последний день месяца–2-е следующего; с 15-го → 15–17-е следующего месяца."}</p>
          {draft.mode === "manual" ? <label className="field"><span className="label" id="notice-manual-label">Основной текст</span>
            <textarea className="input" aria-labelledby="notice-manual-label" rows="3" maxLength={300} required value={draft.manualText} onChange={(e) => update("manualText", e.target.value)} />
          </label> : <label className="field"><span className="label" id="notice-auto-label">Текст с автоматической датой</span>
            <textarea className="input" aria-labelledby="notice-auto-label" aria-describedby="notice-auto-help" rows="3" maxLength={300} required value={draft.autoTemplate} onChange={(e) => update("autoTemplate", e.target.value)} />
            <small id="notice-auto-help">Оставьте одну подстановку {"{dates}"} — вместо неё сайт укажет актуальные даты.</small>
          </label>}
          <label className="field"><span className="label" id="notice-extra-label">Дополнительный текст (необязательно)</span>
            <textarea className="input" aria-labelledby="notice-extra-label" aria-describedby="notice-extra-help" rows="4" maxLength={500} value={draft.additionalText} onChange={(e) => update("additionalText", e.target.value)} />
            <small id="notice-extra-help">Пусто — короткое окно; с текстом — расширенное. Показывается также перед оформлением изделия.</small>
          </label>
          <button className="btn btn-primary" type="submit">{saving ? "Сохраняем…" : "Сохранить сроки"}</button>
        </fieldset>
      </form>
      <div className="admin-production-notice__preview"><h3>Предпросмотр{!draft.enabled ? " (на сайте выключено)" : ""}</h3>
        <ProductionNoticeCard preview text={text} additionalText={draft.additionalText} />
      </div>
    </div>}
  </section>;
}
