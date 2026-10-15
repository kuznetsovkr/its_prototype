import { describe, expect, it } from "vitest";
import { processItemScale } from "./useProcessItemZoom";

describe("ordered process scroll zoom", () => {
  it("reveals a photo before its matching description, without random timings", () => {
    const scales = [0, 1, 2, 3].map((index) => processItemScale({ entry: 200, index, breakpoint: "desktop" }));
    expect(scales[0]).toBeGreaterThan(scales[1]);
    expect(scales[1]).toBeGreaterThan(scales[2]);
    expect(scales[2]).toBeGreaterThan(scales[3]);
  });
  it("bounds all scales and leaves reduced motion static", () => {
    for (const breakpoint of ["desktop", "tablet", "mobile"]) {
      for (const index of [0, 1, 6, 7]) {
        expect(processItemScale({ entry: -100, index, breakpoint })).toBe(0.8);
        expect(processItemScale({ entry: 5000, index, breakpoint })).toBe(1);
        expect(processItemScale({ entry: 0, index, breakpoint, reduced: true })).toBe(1);
      }
    }
  });
});
