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
  return <div className="orderCartShortcut orderDraftNotice" role={constructorDraftError ? "alert" : undefined}>
    {constructorDraftError && <span>{constructorDraftError}</span>}
    {hasDraft && <button type="button" onClick={() => {
      if (!confirmDiscardConstructor(order)) return;
      resetCurrentItem(); navigate("/order");
    }}>Удалить черновик</button>}
  </div>;
};
export default ConstructorDraftNotice;
