import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import RecipientCartList from "./RecipientCartList";
import { cartEmbroideryLabel, cartPaymentBlocked, constructorCartItem, currentCartItem, getCartDraftItem } from "./cartPresentation";

vi.mock("../../utils/url", () => ({ buildImgSrc: (value) => value }));

const item = { id: "saved", productType: "Худи", color: "Чёрный", size: "M", embroideryType: "Patronus", patronusCount: 4, quantity: 1, linePrice: 9000 };
const ready = { initialized: true, pending: false, items: [], error: null };
describe("cart presentation and staged checkout safety", () => {
  it("does not duplicate a saved item or put an unfinished item into a locked checkout", () => {
    const order = { cartItemKey: "key", clothing: { type: "Худи", color: "Чёрный", size: "M" }, embroidery: {}, recipient: {} };
    expect(getCartDraftItem(ready, order)?.draft).toBe(true);
    expect(getCartDraftItem({ ...ready, items: [{ requestKey: "key" }] }, order)).toBeNull();
    expect(getCartDraftItem({ ...ready, checkout: { orderId: 1 } }, order)).toBeNull();
  });
  it("blocks checkout while restoring, after an error or with an empty cart; saved items can now be paid together", () => {
    expect(cartPaymentBlocked(ready)).toBe(false);
    for (const changes of [{ initialized: false }, { pending: true }, { error: "Сеть недоступна" }]) {
      expect(cartPaymentBlocked({ ...ready, ...changes })).toBe(true);
    }
    expect(cartPaymentBlocked(ready, { cartOnly: true })).toBe(true);
    expect(cartPaymentBlocked({ ...ready, items: [item] }, { cartOnly: true })).toBe(false);
    expect(cartPaymentBlocked({ ...ready, error: "Ответ потерян", checkout: { orderId: 1 } }, { cartOnly: true })).toBe(false);
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
  it("unfinished garments are explicitly marked and never show a price or quantity control", () => {
    const draftItem = constructorCartItem({ clothing: { type: "Худи", color: "Чёрный", size: "M" }, embroidery: {}, recipient: {} });
    expect(draftItem.draft).toBe(true);
    expect(cartEmbroideryLabel(draftItem)).toBe("Вышивка ещё не выбрана");
    const html = renderToStaticMarkup(React.createElement(MemoryRouter, null,
      React.createElement(RecipientCartList, { cart: { ...ready, items: [], draftItem } })));
    expect(html).toContain("Незавершённое изделие — не входит в сумму");
    expect(html).toContain("Продолжить оформление");
    expect(html).not.toMatch(/Количество:|Стоимость уточняется|₽/);
    expect(constructorCartItem({ clothing: { type: "Худи" }, embroidery: {} })).toBeNull();
  });
});
