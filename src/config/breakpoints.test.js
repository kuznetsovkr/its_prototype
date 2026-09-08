import { describe, expect, it } from "vitest";
import {
  MEDIA_QUERIES,
  resolveViewportMode,
  VIEWPORT_BREAKPOINTS,
} from "./breakpoints";

describe("viewport breakpoints", () => {
  it("has continuous mobile, tablet and desktop ranges", () => {
    expect(VIEWPORT_BREAKPOINTS.tabletMin).toBe(VIEWPORT_BREAKPOINTS.mobileMax + 1);
    expect(VIEWPORT_BREAKPOINTS.desktopMin).toBe(VIEWPORT_BREAKPOINTS.tabletMax + 1);
  });

  it("uses the shared desktop boundary in media queries", () => {
    expect(MEDIA_QUERIES.tabletMax).toBe("(max-width: 1199px)");
    expect(MEDIA_QUERIES.desktop).toBe("(min-width: 1200px)");
  });

  it.each([
    [639, "mobile"],
    [640, "tablet"],
    [1199, "tablet"],
    [1200, "desktop"],
    [1279, "desktop"],
  ])("resolves %ipx as %s", (width, expectedMode) => {
    expect(resolveViewportMode(width)).toBe(expectedMode);
  });
});
