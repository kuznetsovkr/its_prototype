import { useNavigate } from "react-router-dom";
import { useOrder } from "../../context/OrderContext";
import { constructorSnapshot } from "./constructorDraft";

export const confirmDiscardConstructor = (order) => !order.embroidery.uploadedImage.length || window.confirm(
  "Удалить черновик изделия вместе с выбранными фотографиями? Готовые изделия в корзине останутся."
);

const ConstructorDraftNotice = () => {
  const { order, resetCurrentItem, constructorDraftError } = useOrder();
  const navigate = useNavigate();
  const hasDraft = !order.recipient.savedOrder && Boolean(constructorSnapshot(order));
  if (!hasDraft && !constructorDraftError) return null;
  return <div className="orderCartShortcut orderDraftNotice" role={constructorDraftError ? "alert" : "status"}>
    <span>{constructorDraftError || "Черновик сохраняется в этом браузере на 30 дней после последнего изменения. Фото нужно выбрать заново после закрытия страницы, пока изделие не добавлено в корзину."}</span>
    {hasDraft && <button type="button" onClick={() => {
      if (!confirmDiscardConstructor(order)) return;
      resetCurrentItem(); navigate("/order");
    }}>Удалить черновик</button>}
  </div>;
};
export default ConstructorDraftNotice;
