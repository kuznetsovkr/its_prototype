import { describe, expect, test } from "vitest";
import { buildColorOptions, hasStock, normalizeKey, uniqBy } from "./clothingCatalog";

describe("clothing catalog rules", () => {
  test("deduplicates product type labels without changing them", () => {
    expect(uniqBy(["Худи", "худи", "Свитшот"], normalizeKey)).toEqual([
      "Худи",
      "Свитшот",
    ]);
  });

  test("only positive finite quantity is available", () => {
    expect(hasStock({ quantity: 1 })).toBe(true);
    expect(hasStock({ quantity: 0 })).toBe(false);
    expect(hasStock({ quantity: "unknown" })).toBe(false);
  });

  test("shows only colors present for the selected product type", () => {
    const options = buildColorOptions(
      [
        { color: "Чёрный", colorCode: "#202022", quantity: 3 },
        { color: "Синий", colorCode: "#065EA7", quantity: 0 },
      ],
      [
        { name: "Чёрный", code: "#17191A" },
        { name: "Красный", code: "#C60626" },
      ]
    );

    expect(options).toEqual([
      { label: "Чёрный", code: "#202022", isAvailable: true },
      { label: "Синий", code: "#065EA7", isAvailable: false },
    ]);
  });
});
