import { MEDIA_QUERIES } from "../../../config/breakpoints";

// Reset before painting the new step, without animating the outgoing content.
// Wider layouts keep their existing position between constructor steps.
export const scrollMobileOrderStepToTop = () => {
  if (!window.matchMedia(MEDIA_QUERIES.mobile).matches) return;
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
};
