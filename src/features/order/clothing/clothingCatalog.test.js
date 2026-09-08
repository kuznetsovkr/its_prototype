import { describe, expect, test } from "vitest";
import { hasStock, normalizeInner, parseTypeLabel } from "./clothingCatalog";

describe("clothing catalog rules", () => {
  test("separates a base type from its lining option", () => {
    expect(parseTypeLabel("Худи (без начёса)")).toEqual({
      base: "Худи",
      inner: "без начёса",
    });
    expect(normalizeInner("С НАЧЕСОМ")).toBe("с начёсом");
  });

  test("only positive finite quantity is available", () => {
    expect(hasStock({ quantity: 1 })).toBe(true);
    expect(hasStock({ quantity: 0 })).toBe(false);
    expect(hasStock({ quantity: "unknown" })).toBe(false);
  });
});
