import { describe, expect, it } from "vitest";
import { buildShippingItems } from "./shippingItems";
describe("shipping quote items", () => {
  it("passes only public choices, not photos, personal data, certificate balances or client prices", () => {
    expect(buildShippingItems([{ productType: { name: "Худи" }, color: "Белый", size: "L", embroideryType: "Car", carDesign: "simple", quantity: 2,
      price: 1, certificateCode: "private", comment: "private", phone: "private", attachments: ["private"] }]))
      .toEqual([{ productType: "Худи", color: "Белый", size: "L", embroideryType: "Car", carDesign: "simple", quantity: 2 }]);
  });
  it("includes the relevant count only, so an old selection cannot affect insurance", () => {
    expect(buildShippingItems([{ productType: "Худи", color: "Белый", size: "L", embroideryType: "petFace", petFaceCount: 5, patronusCount: 4, carDesign: "complex" }])[0])
      .toEqual({ productType: "Худи", color: "Белый", size: "L", embroideryType: "petFace", petFaceCount: 5, quantity: 1 });
  });
});
