import { useCallback, useEffect, useState } from "react";
import api from "../api";

const money = (value) => `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
const date = (value) => value ? new Date(value).toLocaleDateString("ru-RU") : "—";
const mailLabels = { pending: "Письмо в очереди", sending: "Письмо отправляется", sent: "Письмо отправлено", failed: "Ошибка отправки письма" };
const CertificateManager = () => {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { const response = await api.get("/admin/certificates", { params: { page, pageSize: 25 } }); setData(response.data); }
    catch (failure) { setError(failure.message || "Не удалось загрузить сертификаты"); }
    finally { setLoading(false); }
  }, [page]);
  useEffect(() => { load(); }, [load]);
  const showHistory = async (id, historyPage = 1) => {
    setError("");
    try {
      const response = await api.get(`/admin/certificates/${id}/history`, { params: { page: historyPage, pageSize: 25 } });
      setHistory({ id, ...response.data });
    } catch (failure) { setError(failure.message || "Не удалось загрузить историю"); }
  };
  return (
    <section className="admin-panel admin-certificates" aria-labelledby="admin-certificates-title">
      <div className="admin-panel__heading">
        <div><p className="admin-panel__eyebrow">04 · подарочные сертификаты</p><h2 id="admin-certificates-title">Сертификаты</h2></div>
        <button className="btn btn-outline" type="button" disabled={loading} onClick={load}>Обновить</button>
      </div>
      <p>Баланс, срок действия и история списаний. Возвраты и отмены разбираются вручную; эта панель не изменяет баланс.</p>
      {error && <p role="alert">{error}</p>}
      {loading && <p role="status">Загружаем сертификаты…</p>}
      {data?.items?.length === 0 && <p>Сертификатов пока нет.</p>}
      <div className="admin-certificates__list">
        {data?.items?.map((item) => <article key={item.id} className="admin-certificates__item">
          <h3>#{item.id} · {item.owner}</h3>
          <p>{item.email}</p><p>{item.statusLabel}{item.testMode ? " · тестовый" : ""}</p>
          <dl><div><dt>Номинал</dt><dd>{money(item.nominal)}</dd></div><div><dt>Баланс</dt><dd>{money(item.balance)}</dd></div>
            <div><dt>В резерве</dt><dd>{money(item.reserved)}</dd></div><div><dt>Доступно</dt><dd>{money(item.available ?? item.balance - item.reserved)}</dd></div>
            <div><dt>Действует до</dt><dd>{date(item.expiresAt)}</dd></div></dl>
          <p>{mailLabels[item.emailDelivery] || "Письмо ещё не создано"}</p>
          <button type="button" className="btn btn-outline" onClick={() => showHistory(item.id)}>История сертификата #{item.id}</button>
        </article>)}
      </div>
      <div className="admin-certificates__navigation">
        <button type="button" className="btn btn-outline" disabled={page === 1 || loading} onClick={() => setPage(page - 1)}>Предыдущие сертификаты</button>
        <span>Страница {page}</span>
        <button type="button" className="btn btn-outline" disabled={!data || page * data.pageSize >= data.total || loading} onClick={() => setPage(page + 1)}>Следующие сертификаты</button>
      </div>
      {history && <section className="admin-certificates__history" aria-label={`История сертификата #${history.id}`}>
        <h3>История сертификата #{history.id}</h3>
        <button type="button" className="btn btn-outline" onClick={() => setHistory(null)}>Закрыть историю</button>
        <ul>{history.items.map((item) => <li key={item.id}>{date(item.createdAt)} · {item.type === "issue" ? "Выдан" : `Заказ #${item.orderId}`} · {money(item.amount)} · баланс {money(item.balanceAfter)}</li>)}</ul>
        <div className="admin-certificates__navigation">
          <button type="button" className="btn btn-outline" disabled={history.page === 1} onClick={() => showHistory(history.id, history.page - 1)}>Предыдущие операции</button>
          <button type="button" className="btn btn-outline" disabled={history.page * history.pageSize >= history.total} onClick={() => showHistory(history.id, history.page + 1)}>Следующие операции</button>
        </div>
      </section>}
    </section>
  );
};
export default CertificateManager;
