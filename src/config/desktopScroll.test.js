import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DESKTOP_SCROLL_OPTIONS,
  DESKTOP_SCROLL_QUERY,
  shouldSmoothWheel,
  shouldKeepNativeScroll,
} from "./desktopScroll";

const wheel = (overrides = {}) => ({
  type: "wheel", deltaX: 0, deltaY: 120, deltaMode: 0, ...overrides,
});

describe("desktop smooth scroll", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("uses the desktop boundary, mouse capability and reference duration", () => {
    expect(DESKTOP_SCROLL_QUERY).toBe("(min-width: 1200px) and (hover: hover) and (pointer: fine)");
    expect(DESKTOP_SCROLL_OPTIONS.duration).toBe(1);
    expect(DESKTOP_SCROLL_OPTIONS.easing(0)).toBe(0);
    expect(DESKTOP_SCROLL_OPTIONS.easing(1)).toBe(1);
    expect(DESKTOP_SCROLL_OPTIONS.easing(0.5)).toBeCloseTo(0.875);
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

  it.each(["text", "tel", "email", "password", "search", "url"])("smooths page scrolling over %s inputs", (type) => {
    expect(shouldKeepNativeScroll({ tagName: "INPUT", type, matches: () => false })).toBe(false);
  });

  it.each(["number", "range", "date", "time", "checkbox", "radio", "file"])("preserves native %s input semantics", (type) => {
    expect(shouldKeepNativeScroll({ tagName: "INPUT", type, matches: () => false })).toBe(true);
  });

  it("only excludes a textarea when it actually has a native scrollable area", () => {
    let style = { overflowX: "hidden", overflowY: "auto" };
    vi.stubGlobal("getComputedStyle", () => style);
    const area = { tagName: "TEXTAREA", matches: () => false, scrollHeight: 80, clientHeight: 80, scrollWidth: 200, clientWidth: 200 };
    expect(shouldKeepNativeScroll(area)).toBe(false);
    area.scrollHeight = 400;
    expect(shouldKeepNativeScroll(area)).toBe(true);
    style = { overflowX: "hidden", overflowY: "hidden" };
    expect(shouldKeepNativeScroll(area)).toBe(false);
    style = { overflowX: "auto", overflowY: "hidden" };
    area.scrollWidth = 400;
    expect(shouldKeepNativeScroll(area)).toBe(true);
  });

  it("keeps explicit native regions even if the target is an ordinary text input", () => {
    expect(shouldKeepNativeScroll({ tagName: "INPUT", type: "text", matches: () => true })).toBe(true);
    expect(shouldKeepNativeScroll({ tagName: "DIV", matches: () => false })).toBe(false);
  });
});
