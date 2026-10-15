import { describe, expect, it } from "vitest";
import { closestReviewPage, wrapReviewPosition } from "./reviewsLoop";

describe("циклические отзывы", () => {
  const metrics = { start: 600, span: 600, loop: true, pages: [600, 800, 1000].map((position, itemIndex) => ({ position, itemIndex })) };
  it("переносит копии в исходный диапазон в обе стороны", () => {
    expect(wrapReviewPosition(1200, 600, 600)).toBe(600);
    expect(wrapReviewPosition(400, 600, 600)).toBe(1000);
    expect(wrapReviewPosition(1810, 600, 600)).toBe(610);
    expect(wrapReviewPosition(5, 0, 0)).toBe(0);
  });
  it("определяет логическую карточку, включая границу и обычный незамкнутый режим", () => {
    expect(closestReviewPage(400, metrics)).toBe(2);
    expect(closestReviewPage(1190, metrics)).toBe(0);
    expect(closestReviewPage(1400, metrics)).toBe(1);
    expect(closestReviewPage(1190, { ...metrics, loop: false })).toBe(2);
  });
});
