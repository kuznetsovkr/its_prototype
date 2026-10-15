export const wrapReviewPosition = (position, start, span) => span > 0
  ? start + (((position - start) % span) + span) % span
  : start;

export const closestReviewPage = (position, { pages, start, span, loop }) => {
  const normalized = loop ? wrapReviewPosition(position, start, span) : position;
  const distance = (page) => {
    const delta = Math.abs(page.position - normalized);
    return loop ? Math.min(delta, span - delta) : delta;
  };
  return pages.reduce((closest, page, index) => distance(page) < distance(pages[closest]) ? index : closest, 0);
};
