import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import RecipientCartList from "./RecipientCartList";
import { cartEmbroideryLabel, cartPaymentBlocked, currentCartItem } from "./cartPresentation";

vi.mock("../../utils/url", () => ({ buildImgSrc: (value) => value }));

const item = { id: "saved", productType: "Худи", color: "Чёрный", size: "M", embroideryType: "Patronus", patronusCount: 4, quantity: 1, linePrice: 9000 };
const ready = { initialized: true, pending: false, items: [], error: null };
describe("cart presentation and staged checkout safety", () => {
  it("blocks single-item payment while restoring, after an error or with saved payable items", () => {
    expect(cartPaymentBlocked(ready)).toBe(false);
    for (const changes of [{ initialized: false }, { pending: true }, { error: "Сеть недоступна" }, { items: [item] }]) {
      expect(cartPaymentBlocked({ ...ready, ...changes })).toBe(true);
    }
    expect(cartPaymentBlocked(ready, { cartOnly: true })).toBe(true);
    expect(cartPaymentBlocked({ ...ready, items: [item] }, { isCustom: true })).toBe(false);
  });
  it("uses actual garment/embroidery data, not mock t-shirt names or default prices", () => {
    const current = currentCartItem({ clothing: { type: "hoodie", profile: { name: "Худи" }, color: "Зелёный", size: "XL", previewSrc: "/actual.webp" },
      embroidery: { type: "petFace", petFaceCount: 5 } });
    expect(current.productType).toBe("Худи");
    expect(current.imageUrl).toBe("/actual.webp");
    expect(cartEmbroideryLabel(current)).toBe("Мордочка питомца × 5");
    expect(currentCartItem({ clothing: {}, embroidery: {} })).toBeNull();
  });
  it("black dots are decorative, quantity at one cannot decrease; current draft has no pretend quantity controls", () => {
    const html = renderToStaticMarkup(React.createElement(MemoryRouter, null,
      React.createElement(RecipientCartList, { cart: { ...ready, items: [item], current: { ...item, id: "current", current: true } } })));
    expect(html).not.toMatch(/type="radio"|role="radio"/);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toMatch(/aria-label="Уменьшить количество: Худи" disabled/);
    expect(html.match(/Увеличить количество:/g)).toHaveLength(1);
    expect(html).toContain("Текущее изделие — ещё не в корзине");
  });
});
