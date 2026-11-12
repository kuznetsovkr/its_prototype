import { useEffect, useState } from "react";
import api from "../api";

const money = (value) => value == null ? "Требует расчёта" : `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
const date = (value) => value ? new Date(value).toLocaleString("ru-RU") : "—";
const paymentLabels = { paid: "Оплата подтверждена", pending: "Ожидает оплаты", manual: "Расчёт и оплата через менеджера",
  cancelled: "Оплата отменена", expired: "Время оплаты истекло", review: "Платёж требует проверки" };
const deliveryLabels = { cdek: "СДЭК", cdek_pvz: "СДЭК — до пункта выдачи", russian_post: "Почта России", pickup: "Самовывоз", manual: "Доставка через менеджера" };
const designLabels = { simple: "простой дизайн", medium: "средний дизайн", complex: "сложный дизайн" };

const OrderManager = () => {
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setData(null);
    setError("");
    api.get("/admin/orders", { params: { page, pageSize: 25 }, signal: controller.signal })
      .then((response) => { if (!controller.signal.aborted) setData(response.data); })
      .catch((failure) => { if (!controller.signal.aborted) setError(failure.message || "Не удалось загрузить заказы"); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, revision]);

  const download = async (order, attachment) => {
    setDownloading(attachment.id);
    setError("");
    try {
      const response = await api.get(`/admin/orders/${order.id}/attachments/${attachment.id}`, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.originalName || `order-${order.id}-photo-${attachment.id}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("Не удалось скачать фото. Возможно, срок его хранения уже истёк. Попробуйте обновить список.");
    } finally {
      setDownloading(null);
    }
  };

  return <section className="admin-panel admin-certificates admin-orders" aria-labelledby="admin-orders-title">
    <div className="admin-panel__heading">
      <div><p className="admin-panel__eyebrow">заказы и заявки</p><h2 id="admin-orders-title">Заказы</h2></div>
      <button className="btn btn-outline" type="button" disabled={loading} onClick={() => setRevision((value) => value + 1)}>Обновить заказы</button>
    </div>
    <p>Просмотр заказов и заявок. Оплата подтверждается автоматически платёжной системой, а не вручную в этой панели.</p>
    {error && <p role="alert">{error}</p>}
    {loading && <p role="status">Загружаем заказы…</p>}
    {data?.items?.length === 0 && <p>Заказов пока нет.</p>}
    <div className="admin-certificates__list">
      {data?.items?.map((order) => <article className="admin-certificates__item" key={order.id}>
        <h3>Заказ #{order.id} · {[order.lastName, order.firstName, order.middleName].filter(Boolean).join(" ")}</h3>
        <p>{date(order.orderDate)}</p>
        <p>{paymentLabels[order.paymentStatus] || "Статус оплаты требует уточнения"}{order.paymentTestMode ? " · тестовый платёж" : ""}</p>
        <p>Статус заказа: {order.status}</p>
        <p>Сумма заказа: {money(order.totalPrice)}</p>
        <details>
          <summary>Подробности заказа #{order.id}</summary>
          <p>Телефон: {order.phone}<br />Email: {order.email || "—"}<br />Связь: {order.preferredContact || "—"}</p>
          {order.recipientFullName && <p>Получатель: {order.recipientFullName}<br />Телефон получателя: {order.recipientPhone || order.phone}</p>}
          {order.paidAt && order.paymentStatus === "paid" && <p>Оплачен: {date(order.paidAt)}</p>}
          <h4>Изделия</h4>
          {(order.isCartOrder ? order.items : [{ ...order, quantity: 1 }]).map((item) => <div key={item.id} className="admin-orders__item">
            <p>{item.productType} · {item.color} · {item.size} · {item.quantity} шт.</p>
            <p>{item.embroideryTypeRu || item.embroideryType}{item.embroideryType === "Patronus" ? ` · патронусов: ${item.patronusCount}` : ""}{item.embroideryType === "petFace" ? ` · мордочек: ${item.petFaceCount}` : ""}{item.embroideryType === "Car" && designLabels[item.carDesign] ? ` · ${designLabels[item.carDesign]}` : ""}</p>
            {item.customText && <p>Надпись: {item.customText}{item.customTextFont ? ` · шрифт: ${item.customTextFont}` : ""}</p>}
            {item.linePrice != null && <p>Стоимость позиции: {money(item.linePrice)}</p>}
            {item.comment && <p className="admin-orders__comment">Пожелания: {item.comment}</p>}
            {order.attachments?.filter((attachment) => !order.isCartOrder || attachment.orderItemId === item.id).map((attachment) =>
              <button className="btn btn-outline" type="button" key={attachment.id} disabled={downloading !== null} onClick={() => download(order, attachment)}>
                {downloading === attachment.id ? "Скачиваем…" : `Скачать фото: ${attachment.originalName || attachment.id}`}
              </button>)}
          </div>)}
          {order.isCartOrder && order.comment && <p className="admin-orders__comment">Комментарий к заказу: {order.comment}</p>}
          {order.isCartOrder && order.attachments?.filter((attachment) => attachment.orderItemId == null).map((attachment) =>
            <button className="btn btn-outline" type="button" key={attachment.id} disabled={downloading !== null} onClick={() => download(order, attachment)}>Скачать фото: {attachment.originalName || attachment.id}</button>)}
          <h4>Доставка</h4>
          <p>{deliveryLabels[order.deliveryMode] || order.deliveryMode || "Уточняется"} · {order.deliveryCity || "Город не указан"}</p>
          <p>{order.deliveryAddress || "Адрес уточняется"}</p>
          {order.deliveryComment && <p className="admin-orders__comment">{order.deliveryComment}</p>}
          {order.shipment?.cdekNumber && <p>Номер СДЭК: {order.shipment.cdekNumber}</p>}
          {order.deliveryMode === "russian_post" ? <p>Доставка оплачивается отдельно через менеджера после изготовления.</p>
            : order.deliveryAmountKopecks != null && <p>Доставка: {money(order.deliveryAmountKopecks / 100)}</p>}
          {order.certificateDiscountKopecks > 0 && <p>Оплачено сертификатом: {money(order.certificateDiscountKopecks / 100)}</p>}
          {order.amountDueKopecks != null && <p>К оплате через банк при оформлении: {money(order.amountDueKopecks / 100)}</p>}
        </details>
      </article>)}
    </div>
    <div className="admin-certificates__navigation">
      <button className="btn btn-outline" type="button" disabled={page === 1 || loading} onClick={() => setPage((value) => value - 1)}>Предыдущие заказы</button>
      <span>Страница {page}</span>
      <button className="btn btn-outline" type="button" disabled={!data || page * data.pageSize >= data.total || loading} onClick={() => setPage((value) => value + 1)}>Следующие заказы</button>
    </div>
  </section>;
};
export default OrderManager;
