import OrderModal from "../shared/OrderModal";
import cat from "../../../images/order/work-examples/cat.png";
import car from "../../../images/order/work-examples/car.png";
import dogs from "../../../images/order/work-examples/dogs.png";
import portrait from "../../../images/order/work-examples/portrait.png";
import corgi from "../../../images/order/work-examples/corgi.png";

const examples = [
  { name: "cat", src: cat, alt: "Вышивка кота на голубой ткани" },
  { name: "car", src: car, alt: "Вышивка автомобиля и надписи 1985" },
  { name: "dogs", src: dogs, alt: "Вышивка двух собак на бордовой ткани" },
  { name: "portrait", src: portrait, alt: "Вышитый портрет на чёрной ткани" },
  { name: "corgi", src: corgi, alt: "Вышивка корги на белой футболке" },
];

const WorkExamplesModal = ({ onClose, returnFocusTo }) => (
  <OrderModal className="workExamplesModal" labelledBy="work-examples-title" onClose={onClose} returnFocusTo={returnFocusTo}>
    <h2 className="workExamplesModal__title" id="work-examples-title">Примеры работ</h2>
    <div className="workExamplesModal__grid">
      {examples.map(({ name, src, alt }) => (
        <img className={`workExamplesModal__image workExamplesModal__image--${name}`} src={src} alt={alt} key={name} />
      ))}
    </div>
  </OrderModal>
);

export default WorkExamplesModal;
