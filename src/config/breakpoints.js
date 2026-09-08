export const VIEWPORT_BREAKPOINTS = Object.freeze({
  mobileMax: 639,
  tabletMin: 640,
  tabletMax: 1199,
  desktopMin: 1200,
});

export const MEDIA_QUERIES = Object.freeze({
  mobile: `(max-width: ${VIEWPORT_BREAKPOINTS.mobileMax}px)`,
  tablet: `(min-width: ${VIEWPORT_BREAKPOINTS.tabletMin}px) and (max-width: ${VIEWPORT_BREAKPOINTS.tabletMax}px)`,
  tabletMax: `(max-width: ${VIEWPORT_BREAKPOINTS.tabletMax}px)`,
  desktop: `(min-width: ${VIEWPORT_BREAKPOINTS.desktopMin}px)`,
});

export const resolveViewportMode = (width) => {
  if (width <= VIEWPORT_BREAKPOINTS.mobileMax) return "mobile";
  if (width <= VIEWPORT_BREAKPOINTS.tabletMax) return "tablet";
  return "desktop";
};
