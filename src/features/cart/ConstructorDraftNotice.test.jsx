import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import ConstructorDraftNotice from "./ConstructorDraftNotice";

const state = vi.hoisted(() => ({ current: null }));
vi.mock("react-router-dom", () => ({ useNavigate: () => () => {} }));
vi.mock("../../context/OrderContext", () => ({ useOrder: () => state.current }));
const order = { cartItemKey: "11111111-1111-4111-8111-111111111111",
  clothing: { type: "Hoodie", color: "Black", size: "M" }, embroidery: {}, recipient: {} };

describe("constructor draft notice", () => {
  it("keeps the discard action without showing a permanent storage explanation", () => {
    state.current = { order, resetCurrentItem: () => {}, constructorDraftError: "" };
    const html = renderToStaticMarkup(<ConstructorDraftNotice />);
    expect(html).toContain("Удалить черновик");
    expect(html).not.toContain("Черновик сохраняется");
    expect(html).not.toContain("Фото нужно выбрать");
    expect(html).not.toContain('role="status"');
  });
  it("preserves actual save errors and hides an empty draft", () => {
    state.current = { order, resetCurrentItem: () => {}, constructorDraftError: "Не удалось сохранить черновик" };
    expect(renderToStaticMarkup(<ConstructorDraftNotice />)).toContain('role="alert"');
    expect(renderToStaticMarkup(<ConstructorDraftNotice />)).toContain("Не удалось сохранить черновик");
    state.current = { ...state.current, order: { ...order, clothing: {} }, constructorDraftError: "" };
    expect(renderToStaticMarkup(<ConstructorDraftNotice />)).toBe("");
  });
});
