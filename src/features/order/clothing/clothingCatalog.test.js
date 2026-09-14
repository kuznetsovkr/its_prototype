import { describe, expect, test } from "vitest";
import {
  buildColorOptions,
  buildSizeOptions,
  hasStock,
  isOrderableProfile,
  normalizeKey,
  uniqBy,
} from "./clothingCatalog";

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

  test("builds the size list from inventory without dropping custom sizes", () => {
    expect(buildSizeOptions([
      { size: "3XL" },
      { size: "S" },
      { size: "ONE SIZE" },
      { size: "s" },
      { size: "XL" },
    ])).toEqual(["S", "XL", "3XL", "ONE SIZE"]);
  });

  test("requires an explicit complete server profile before an item can be ordered", () => {
    const configured = {
      patronusLimit: 5,
      prices: { Patronus: 10000, Car: 8500, petFace: 8000 },
      package: { width: 35, height: 35, length: 7, weight: 800 },
    };
    expect(isOrderableProfile(configured)).toBe(true);
    expect(isOrderableProfile({ ...configured, prices: { ...configured.prices, Car: null } })).toBe(false);
    expect(isOrderableProfile(null)).toBe(false);
  });
});
