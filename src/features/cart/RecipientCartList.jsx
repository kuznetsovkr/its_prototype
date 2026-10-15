import { Link } from "react-router-dom";
import dot from "../../images/order/cart-dot.svg";
import quantityCircle from "../../images/order/cart-quantity.svg";
import removeIcon from "../../images/order/cart-remove.svg";
import { cartEmbroideryLabel } from "./cartPresentation";
import { buildImgSrc } from "../../utils/url";

const money = (value) => `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;

const RecipientCartList = ({ cart, disabled = false }) => {
  const items = [...cart.items, ...(cart.current ? [cart.current] : []), ...(cart.draftItem ? [cart.draftItem] : [])];
  return (
    <div className="recipientCart" aria-busy={cart.busy}>
      {!cart.initialized && <p role="status">Загружаем корзину…</p>}
      {cart.initialized && !items.length && <p>В корзине пока нет изделий.</p>}
      <ul className="recipientCart__items" aria-label="Изделия в корзине">
        {items.map((item) => (
          <li className="recipientCart__item" key={item.id}>
            <div className="recipientCart__image">
              {item.imageUrl ? <img src={buildImgSrc(item.imageUrl)} alt={item.productType} /> : <span>Нет фото</span>}
            </div>
            <div className="recipientCart__details">
              <h2><span className="recipientCart__dot" aria-hidden="true"><img src={dot} alt="" /></span>{item.productType}</h2>
              <p>{cartEmbroideryLabel(item)}, Цвет: {item.color}, Размер: {item.size}</p>
              {item.draft ? <>
                <small>Незавершённое изделие — не входит в сумму</small>
                <Link className="recipientCart__continue" to="/order">Продолжить оформление</Link>
              </> : item.current ? <small>Текущее изделие — ещё не в корзине</small> : (
                <div className="recipientCart__quantity" role="group" aria-label={`Количество: ${item.productType}, ${item.color}, ${item.size}`}>
                  <button type="button" aria-label={`Уменьшить количество: ${item.productType}`}
                    disabled={disabled || cart.busy || Boolean(cart.checkout) || item.quantity <= 1} onClick={() => cart.changeQuantity(item.id, item.quantity - 1)}>
                    <img src={quantityCircle} alt="" aria-hidden="true" /><span aria-hidden="true">−</span>
                  </button>
                  <span aria-live="polite">{item.quantity} шт</span>
                  <button type="button" aria-label={`Увеличить количество: ${item.productType}`}
                    disabled={disabled || cart.busy || Boolean(cart.checkout) || item.quantity >= 20} onClick={() => cart.changeQuantity(item.id, item.quantity + 1)}>
                    <img src={quantityCircle} alt="" aria-hidden="true" /><span aria-hidden="true">+</span>
                  </button>
                </div>
              )}
              {!item.current && !item.draft && <small>{item.pricingError || item.stockWarning || (item.linePrice != null ? money(item.linePrice) : "Стоимость уточняется")}</small>}
            </div>
            {!item.current && <button className="recipientCart__remove" type="button"
              aria-label={`Удалить изделие: ${item.productType}, ${item.color}, ${item.size}`}
              disabled={disabled || cart.busy || Boolean(cart.checkout)} onClick={() => item.draft ? cart.discardDraft() : cart.removeItem(item.id)}>
              <img src={removeIcon} alt="" aria-hidden="true" />
            </button>}
          </li>
        ))}
      </ul>
      {cart.items.length > 0 && <p className="recipientCart__total" aria-live="polite">
        {cart.merchandisePrice != null ? `Изделия в корзине: ${money(cart.merchandisePrice)}` : "Не удалось рассчитать стоимость всех изделий"}
        <small>Без доставки{cart.current ? " и текущего изделия" : ""}. Цена проверяется при оформлении.</small>
      </p>}
      {cart.uiError && <p className="recipientCart__error" role="alert">{cart.uiError}</p>}
      {cart.draftItem && cart.constructorDraftError && <p className="recipientCart__error" role="alert">{cart.constructorDraftError}</p>}
      {cart.error && <button type="button" className="recipientCart__retry" disabled={cart.busy}
        onClick={() => cart.reloadCart().catch(() => undefined)}>Повторить загрузку корзины</button>}
      {cart.cartOnly && <Link className="recipientCart__continue" to="/order">Создать ещё одно изделие</Link>}
    </div>
  );
};

export default RecipientCartList;
