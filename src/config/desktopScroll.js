import { MEDIA_QUERIES } from "./breakpoints";

export const DESKTOP_SCROLL_QUERY = `${MEDIA_QUERIES.desktop} and (hover: hover) and (pointer: fine)`;

export const DESKTOP_SCROLL_OPTIONS = Object.freeze({
  duration: 0.8,
  // The designer's reference uses a 75px step for a 120-unit wheel tick.
  wheelMultiplier: 75 / 120,
  smoothWheel: true,
  syncTouch: false,
  autoRaf: true,
  allowNestedScroll: true,
  stopInertiaOnNavigate: true,
  anchors: false,
});

export const shouldSmoothWheel = (event) => {
  if (event.type !== "wheel" || event.ctrlKey || event.metaKey || event.shiftKey || event.deltaX) return false;

  const delta = Math.abs(event.deltaY);
  if (!delta) return false;
  if (event.deltaMode !== 0) return true;

  // Fine-grained pixel gestures retain the touchpad's native inertia. Browsers
  // do not expose the input device, so only discrete wheel ticks are enhanced.
  return Number.isInteger(delta) && (delta % 100 === 0 || delta % 120 === 0);
};

export const NATIVE_SCROLL_SELECTOR = [
  "input", "textarea", "select", "iframe", "video", "embed", "object",
  '[contenteditable]:not([contenteditable="false"])',
  '[role="dialog"]', '[aria-modal="true"]', "[data-native-scroll]",
  ".home-reviews-carousel__viewport",
].join(", ");
