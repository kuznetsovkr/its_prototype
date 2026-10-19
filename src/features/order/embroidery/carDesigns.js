import simple from "../../../images/order/cars/simple.webp";
import medium from "../../../images/order/cars/medium.webp";
import complex from "../../../images/order/cars/complex.webp";

export const CAR_DESIGNS = Object.freeze([
  { value: "simple", label: "Простой дизайн", size: "около 15 см", image: simple,
    description: "Лёгкий фон, например контурные горы или надпись, входит в стоимость." },
  { value: "medium", label: "Средний дизайн", size: "23 см", image: medium,
    description: "Более детальная прорисовка бликов и теней. Фон входит в стоимость." },
  { value: "complex", label: "Сложный дизайн", size: "30 см", image: complex,
    description: "Максимальная детализация и фон." },
]);
export const normalizeCarDesign = (value) => CAR_DESIGNS.some((item) => item.value === value) ? value : "";
export const getCarDesignPrice = (prices, design, clothingCode) => {
  const price = prices?.[design];
  return clothingCode === "tshirt" && design === "complex" ? null
    : normalizeCarDesign(design) && Number.isSafeInteger(price) && price > 0 ? price : null;
};
export const getCarDesignLabel = (value) => CAR_DESIGNS.find((item) => item.value === value)?.label || "";
