import { fileURLToPath } from "node:url";
import { compileString } from "sass";
import { describe, expect, it } from "vitest";

const loadPaths = [fileURLToPath(new URL("../assets/styles/base/", import.meta.url))];
const compile = (source) => compileString(`@use "compactScale" as scale; ${source}`, { loadPaths }).css;

describe("compact layout design pixels", () => {
  it("uses 320/640 bases and the existing viewport boundaries", () => {
    const css = compile(".sample { @include scale.container; width: scale.px(300); }");
    expect(css).toContain("--compact-layout-pixel: 1px");
    expect(css).toContain("(max-width: 639px)");
    expect(css).toContain("max(1px, 0.3125vw)");
    expect(css).toContain("(min-width: 640px) and (max-width: 1199px)");
    expect(css).toContain("--compact-layout-pixel: 0.15625vw");
    expect(css).not.toContain("zoom:");
    expect(css).not.toContain("transform:");
  });

  it("scales positive, negative and fractional design pixels with a desktop fallback", () => {
    const css = compile(".sample { width: scale.px(300); top: scale.px(-1); left: scale.px(2.5); }");
    expect(css).toContain("calc(300 * var(--compact-layout-pixel, 1px))");
    expect(css).toContain("calc(-1 * var(--compact-layout-pixel, 1px))");
    expect(css).toContain("calc(2.5 * var(--compact-layout-pixel, 1px))");
  });

  it("requires interpolation when used inside animation custom properties", () => {
    const css = compile(".sample { --float-distance: #{scale.px(10)}; }");
    expect(css).toContain("--float-distance: calc(10 * var(--compact-layout-pixel, 1px))");
    expect(css).not.toContain("scale.px(");
  });

  it("rejects dimensions with units to avoid invalid CSS multiplication", () => {
    expect(() => compile(".sample { width: scale.px(300px); }"))
      .toThrow("expects a unitless number of design pixels");
  });

  it("exposes scalable form typography to the mobile 16px safeguard", () => {
    const css = compile(".sample { @include scale.control-font(10); }");
    expect(css).toContain("--mobile-control-font-size: calc(10 * var(--compact-layout-pixel, 1px))");
    expect(css).toContain("font-size: calc(10 * var(--compact-layout-pixel, 1px))");
    expect(css).not.toContain("scale.px(");
  });
});
