import OrderModal from "../../features/order/shared/OrderModal";

const ReviewModal = ({ index, onClose, returnFocusTo, src }) => (
  <OrderModal
    className="homeReviewModal"
    closeLabel="Закрыть отзыв"
    labelledBy="home-review-modal-title"
    onClose={onClose}
    returnFocusTo={returnFocusTo}
  >
    <h2 className="homeReviewModal__title" id="home-review-modal-title">Отзыв клиента {index + 1}</h2>
    <img className="homeReviewModal__image" src={src} alt={`Изображение отзыва клиента ${index + 1}`} />
  </OrderModal>
);

export default ReviewModal;
