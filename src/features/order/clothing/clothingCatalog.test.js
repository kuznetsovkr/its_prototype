import { describe, expect, test } from "vitest";
import { hasStock, normalizeKey, uniqBy } from "./clothingCatalog";

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
});
