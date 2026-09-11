import { Link } from "react-router-dom";
import notFoundDog from "../images/home/desktop/questions-dog-two.webp";

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const NotFoundPage = () => (
  <section className="notFoundPage" aria-labelledby="not-found-title">
    <div className="notFoundPage__card">
      <div className="notFoundPage__visual" aria-hidden="true">
        <span className="notFoundPage__number">404</span>
        <span className="notFoundPage__spark notFoundPage__spark--one">✦</span>
        <span className="notFoundPage__spark notFoundPage__spark--two">✦</span>
        <div className="notFoundPage__seal">
          <span>кажется</span>
          <strong>не сюда</strong>
        </div>
        <img className="notFoundPage__dog" src={notFoundDog} alt="" />
      </div>

      <div className="notFoundPage__content">
        <p className="notFoundPage__eyebrow">
          <span aria-hidden="true">404</span>
          страница потерялась
        </p>
        <h1 className="notFoundPage__title" id="not-found-title">
          Похоже, мы свернули не туда.
        </h1>
        <p className="notFoundPage__text">
          Такой страницы нет или она переехала. Вернитесь на главную либо начните создавать своё изделие.
        </p>

        <div className="notFoundPage__actions">
          <Link className="notFoundPage__action notFoundPage__action--primary" to="/">
            <span>на главную</span>
            <ArrowIcon />
          </Link>
          <Link className="notFoundPage__action notFoundPage__action--secondary" to="/order">
            <span>сделать заказ</span>
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </div>
  </section>
);

export default NotFoundPage;
