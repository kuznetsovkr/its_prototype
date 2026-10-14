import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { CartProvider, useCart } from "../../src/context/CartContext";
import { createCartItemKey } from "../../src/features/cart/cartItem";

const Harness = () => {
  const cart = useCart();
  const [file, setFile] = useState(null);
  const [restored, setRestored] = useState(null);
  const [preview, setPreview] = useState("");
  const key = useRef(createCartItemKey());
  useEffect(() => {
    const image = restored?.embroidery.uploadedImage[0];
    if (!image) return undefined;
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [restored]);
  const add = (type) => cart.addItem({
    clothing: { type, color: "Черный", size: "M" },
    embroidery: { type: "Patronus", typeSelectionExplicit: true, patronusCount: 1, petFaceCount: 1, comment: type, uploadedImage: [file] },
    recipient: { privacyConsent: true },
  }, { requestKey: key.current, turnstileToken: "fixture-challenge" }).then(() => { key.current = createCartItemKey(); }).catch(() => {});
  return (
    <main>
      <input aria-label="Фото" type="file" onChange={(event) => setFile(event.target.files[0])} />
      <button disabled={!file || cart.pending} onClick={() => add("Худи")}>Добавить худи</button>
      <button disabled={!file || cart.pending} onClick={() => add("Футболка")}>Добавить футболку</button>
      <p role="alert">{cart.error}</p>
      <p data-testid="item-count">{cart.items.length}</p>
      <pre data-testid="items">{JSON.stringify(cart.items)}</pre>
      <button disabled={!cart.items.length || cart.pending} onClick={() => cart.restoreItem(cart.items[0].id).then(setRestored).catch(() => {})}>Восстановить фото</button>
      <button disabled={cart.pending} onClick={() => cart.clearCart().catch(() => {})}>Очистить</button>
      <span data-testid="restored-name">{restored?.embroidery.uploadedImage[0]?.name}</span>
      {preview && <img alt="Восстановленная фотография" src={preview} />}
    </main>
  );
};
createRoot(document.getElementById("root")).render(<CartProvider><Harness /></CartProvider>);
