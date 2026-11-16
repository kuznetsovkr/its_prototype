import { describe, expect, test } from "vitest";
import {
  getEmbroideryAvailabilityError,
  getEmbroideryCountError,
  getPatronusLimit,
  MAX_PATRONUS_COUNT,
  MAX_PET_FACE_COUNT,
} from "./embroideryLimits";

describe("embroidery count limits", () => {
  test("forbids even one T-shirt Patronus without affecting other designs or garments", () => {
    expect(getEmbroideryCountError({ type: "Patronus", patronusCount: 1, patronusLimit: 1, clothingCode: "tshirt" }))
      .toContain("недоступна для футболки");
    for (const type of ["Car", "petFace", "custom", ""]) {
      expect(getEmbroideryAvailabilityError({ type, clothingCode: "tshirt" })).toBe("");
    }
    for (const clothingCode of ["hoodie", "svitshot"]) {
      expect(getEmbroideryCountError({ type: "Patronus", patronusCount: 4, patronusLimit: 4, clothingCode })).toBe("");
    }
  });
  test("caps patronuses at four while preserving smaller product limits", () => {
    expect(MAX_PATRONUS_COUNT).toBe(4);
    expect(getPatronusLimit({ patronusLimit: 5 })).toBe(4);
    expect(getPatronusLimit({ patronusLimit: 1 })).toBe(1);
    expect(getEmbroideryCountError({
      type: "Patronus", patronusCount: 4, patronusLimit: 4,
    })).toBe("");
    expect(getEmbroideryCountError({
      type: "Patronus", patronusCount: 5, patronusLimit: 4,
    })).toContain("не более 4 патронусов");
  });

  test("keeps five pet portraits and does not constrain unrelated types", () => {
    expect(MAX_PET_FACE_COUNT).toBe(5);
    expect(getEmbroideryCountError({
      type: "petFace", petFaceCount: 5,
    })).toBe("");
    expect(getEmbroideryCountError({
      type: "petFace", petFaceCount: 6,
    })).toContain("не более 5 портретов");
    expect(getEmbroideryCountError({
      type: "Car", patronusCount: 5, petFaceCount: 6, patronusLimit: 4,
    })).toBe("");
  });
});
