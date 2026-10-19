import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CAR_DESIGNS, normalizeCarDesign, getCarDesignPrice } from "./carDesigns";
import CarDesignSelector from "./CarDesignSelector";
import { buildCartItemFormData } from "../../cart/cartItem";
import { constructorSnapshot } from "../../cart/constructorDraft";
import { cartEmbroideryLabel } from "../../cart/cartPresentation";

describe("car designs", () => {
  it("shows only approved types, descriptions and optimized examples", () => {
    expect(CAR_DESIGNS.map((item) => item.value)).toEqual(["simple", "medium", "complex"]);
    for (const design of CAR_DESIGNS) expect(design.image).toContain(".webp");
    const html = renderToStaticMarkup(<CarDesignSelector value="" prices={{ simple: 5000, medium: 7000, complex: null }} clothingCode="tshirt" />);
    expect(html.match(/type="radio"/g)).toHaveLength(3);
    expect(html).toContain("Не предлагается для футболки");
    expect(html).toMatch(/<input[^>]*disabled=""[^>]*value="complex"/);
    expect(html).not.toContain('checked=""');
    expect(html).toContain("входит в стоимость");
  });
  it("does not invent a price or revive a forbidden combination", () => {
    expect(normalizeCarDesign("__proto__")).toBe("");
    expect(getCarDesignPrice({ complex: 11500 }, "complex", "tshirt")).toBeNull();
    for (const value of [null, undefined, 0, -1, "6500"]) expect(getCarDesignPrice({ simple: value }, "simple", "hoodie")).toBeNull();
    expect(getCarDesignPrice({ simple: 6500 }, "simple", "hoodie")).toBe(6500);
  });
  it("preserves the explicit design in the persistent draft and multipart cart item", () => {
    const draft = { cartItemKey: "24ef78aa-21d6-4b27-bd1f-736cac521cf0", clothing: { type: "Худи", color: "Чёрный", size: "M" },
      embroidery: { type: "Car", typeSelectionExplicit: true, carDesign: "medium", uploadedImage: [new File(["abc"], "car.png", { type: "image/png" })] },
      recipient: { privacyConsent: true } };
    expect(constructorSnapshot(draft).embroidery.carDesign).toBe("medium");
    expect(buildCartItemFormData(draft, { requestKey: draft.cartItemKey }).get("carDesign")).toBe("medium");
    expect(cartEmbroideryLabel({ embroideryType: "Car", carDesign: "medium" })).toContain("средний дизайн");
    expect(() => buildCartItemFormData({ ...draft, embroidery: { ...draft.embroidery, carDesign: "" } }, { requestKey: draft.cartItemKey })).toThrow("Выберите сложность");
  });
});
