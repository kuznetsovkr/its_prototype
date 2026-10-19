import { CAR_DESIGNS, getCarDesignPrice } from "./carDesigns";

const formatPrice = (price) => `${new Intl.NumberFormat("ru-RU").format(price)} ₽`;
const CarDesignSelector = ({ value, onChange, prices, loading, clothingCode }) => (
  <fieldset className="carDesignSelector" aria-describedby="car-design-help">
    <legend>Сложность дизайна автомобиля</legend>
    <p id="car-design-help">Выберите вариант. Цена включает изделие и вышивку.</p>
    {CAR_DESIGNS.map((design) => {
      const price = getCarDesignPrice(prices, design.value, clothingCode);
      const unavailable = clothingCode === "tshirt" && design.value === "complex";
      const disabled = unavailable || loading || price == null;
      return <label className={`carDesignSelector__option${value === design.value ? " is-selected" : ""}${disabled ? " is-unavailable" : ""}`} key={design.value}>
        <input type="radio" name="carDesign" value={design.value} checked={value === design.value}
          disabled={disabled} onChange={() => onChange(design.value)} aria-label={`${design.label}, ${design.size}`} />
        <img src={design.image} alt={`Пример: ${design.label.toLowerCase()}`} width="72" height="96" />
        <span className="carDesignSelector__text"><strong>{design.label} · {design.size}</strong>
          <span>{design.description}</span>
          <em>{unavailable ? "Не предлагается для футболки" : loading ? "Рассчитываем…" : price == null ? "Временно недоступно" : formatPrice(price)}</em>
        </span>
      </label>;
    })}
  </fieldset>
);
export default CarDesignSelector;
