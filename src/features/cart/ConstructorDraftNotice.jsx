import { useOrder } from "../../context/OrderContext";

export const confirmDiscardConstructor = (order) => !order.embroidery.uploadedImage.length || window.confirm(
  "Удалить черновик изделия вместе с выбранными фотографиями? Готовые изделия в корзине останутся."
);

const ConstructorDraftNotice = () => {
  const { constructorDraftError } = useOrder();
  if (!constructorDraftError) return null;
  return <div className="orderCartShortcut orderDraftNotice" role="alert">
    <span>{constructorDraftError}</span>
  </div>;
};
export default ConstructorDraftNotice;
