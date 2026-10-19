import { useState } from "react";
import { createRoot } from "react-dom/client";
import MyCdekWidget from "../../src/components/MyCdekWidget";
const items = [{ productType: "Худи", color: "Белый", size: "M", embroideryType: "Car", carDesign: "simple", quantity: 1 },
  { productType: "Футболка", color: "Чёрный", size: "L", embroideryType: "petFace", petFaceCount: 1, quantity: 1 }];
const singleItem = items.slice(0, 1);
const Harness = () => {
  const [count, setCount] = useState(2); const [rate, setRate] = useState(null); const [open, setOpen] = useState(true);
  return <><button onClick={() => setCount(count === 2 ? 1 : 2)}>Изменить состав</button>
    <button onClick={() => setOpen(!open)}>Открыть / закрыть</button><output aria-label="Стоимость">{rate}</output><div id="cdek-map" />
    {open && <MyCdekWidget shippingItems={count === 2 ? items : singleItem} onRateSelect={setRate} />}</>;
};
createRoot(document.getElementById("root")).render(<Harness />);
