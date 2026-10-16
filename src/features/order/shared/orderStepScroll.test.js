import { afterEach, describe, expect, it, vi } from "vitest";
import { MEDIA_QUERIES } from "../../../config/breakpoints";
import { scrollMobileOrderStepToTop } from "./orderStepScroll";

afterEach(() => vi.unstubAllGlobals());

describe("constructor step scroll", () => {
  it("immediately opens the start of a mobile step", () => {
    const scrollTo = vi.fn();
    const matchMedia = vi.fn(() => ({ matches: true }));
    vi.stubGlobal("window", { matchMedia, scrollTo });

    scrollMobileOrderStepToTop();

    expect(matchMedia).toHaveBeenCalledWith(MEDIA_QUERIES.mobile);
    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ top: 0, left: 0, behavior: "instant" });
  });

  it("does not change scrolling on wider layouts", () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }), scrollTo });

    scrollMobileOrderStepToTop();

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
