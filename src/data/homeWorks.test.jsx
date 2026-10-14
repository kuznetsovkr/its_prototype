import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { getHomeWorks, homeWorks } from "./homeWorks";
import WorksSection from "../components/home/WorksSection";

vi.mock("../components/home/useWorksScrollZoom", () => ({ default: () => null }));

describe("approved work/photo pairs", () => {
  it("contains exactly 18 stable, distinct pairs with non-empty optimized local assets", () => {
    expect(homeWorks).toHaveLength(18);
    expect(new Set(homeWorks.map((work) => work.id)).size).toBe(18);
    expect(new Set(homeWorks.map((work) => work.work)).size).toBe(18);
    expect(new Set(homeWorks.map((work) => work.photo)).size).toBe(18);
    for (const work of homeWorks) {
      expect(work.label).toBeTruthy();
      for (const kind of ["work", "photo"]) {
        const file = readFileSync(new URL(`../images/home/works-pairs/${work.id}-${kind}.webp`, import.meta.url));
        expect(file.length).toBeGreaterThan(0);
        expect(file.subarray(0, 4).toString()).toBe("RIFF");
        expect(file.subarray(8, 12).toString()).toBe("WEBP");
      }
    }
  });

  it.each(["desktop", "tablet", "mobile"])("does not omit or repeat pairs in the expanded %s gallery", (breakpoint) => {
    const { initialItems, additionalItems } = getHomeWorks(breakpoint);
    expect(initialItems).toHaveLength(breakpoint === "mobile" ? 6 : 9);
    const items = [...initialItems, ...additionalItems];
    expect(items).toHaveLength(18);
    expect(new Set(items.map((item) => item.id)).size).toBe(18);
    expect(new Set(items.map((item) => item.id))).toEqual(new Set(homeWorks.map((work) => work.id)));
  });

  it("renders only the initial works, with native comparison buttons and no upfront original-photo requests", () => {
    const assets = { ...getHomeWorks("desktop"), headingStickers: [] };
    const html = renderToStaticMarkup(<WorksSection assets={assets} breakpoint="desktop" />);
    expect(html.match(/class="home-work-card"/g)).toHaveLength(9);
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(9);
    expect(html).toContain('id="home-works-instructions"');
    expect(html).toContain("Escape возвращает вышивку");
    for (const item of assets.initialItems) {
      expect(html).toContain(`data-work-id="${item.id}"`);
      expect(html).toContain(`src="${item.work}"`);
      expect(html).toContain(`Показать исходное фото: ${item.label}`);
      expect(html).not.toContain(`src="${item.photo}"`);
    }
  });
});
