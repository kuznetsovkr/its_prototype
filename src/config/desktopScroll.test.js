import { describe, expect, it } from "vitest";
import {
  DESKTOP_SCROLL_OPTIONS,
  DESKTOP_SCROLL_QUERY,
  shouldSmoothWheel,
} from "./desktopScroll";

const wheel = (overrides = {}) => ({
  type: "wheel", deltaX: 0, deltaY: 120, deltaMode: 0, ...overrides,
});

describe("desktop smooth scroll", () => {
  it("uses the desktop boundary, mouse capability and reference duration", () => {
    expect(DESKTOP_SCROLL_QUERY).toBe("(min-width: 1200px) and (hover: hover) and (pointer: fine)");
    expect(DESKTOP_SCROLL_OPTIONS.duration).toBe(0.8);
    expect(DESKTOP_SCROLL_OPTIONS.wheelMultiplier * 120).toBe(75);
    expect(DESKTOP_SCROLL_OPTIONS.syncTouch).toBe(false);
    expect(DESKTOP_SCROLL_OPTIONS.anchors).toBe(false);
  });

  it.each([100, -100, 120, -120, 240, 300])("enhances a discrete %ipx wheel tick", (deltaY) => {
    expect(shouldSmoothWheel(wheel({ deltaY }))).toBe(true);
  });

  it.each([1, 4.5, 28, 75, 123.25, 0])("leaves fine-grained %spx touchpad gestures native", (deltaY) => {
    expect(shouldSmoothWheel(wheel({ deltaY }))).toBe(false);
  });

  it.each([
    { ctrlKey: true }, { metaKey: true }, { shiftKey: true },
    { deltaX: 120 }, { type: "touchmove" }, { type: "touchstart" },
  ])("does not intercept zoom, horizontal or touch gestures: %j", (override) => {
    expect(shouldSmoothWheel(wheel(override))).toBe(false);
  });

  it.each([1, 2])("supports wheel events in delta mode %i", (deltaMode) => {
    expect(shouldSmoothWheel(wheel({ deltaMode, deltaY: 3 }))).toBe(true);
  });
});
