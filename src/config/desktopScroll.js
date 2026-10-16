import { MEDIA_QUERIES } from "./breakpoints";

export const DESKTOP_SCROLL_QUERY = `${MEDIA_QUERIES.desktop} and (hover: hover) and (pointer: fine)`;

export const DESKTOP_SCROLL_OPTIONS = Object.freeze({
  duration: 1,
  // A cubic tail keeps the final part of a wheel gesture visible instead of
  // completing almost all motion in the first fraction of the animation.
  easing: (progress) => 1 - (1 - progress) ** 3,
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
  "select", "iframe", "video", "embed", "object",
  '[contenteditable]:not([contenteditable="false"])',
  '[role="dialog"]', '[aria-modal="true"]', "[data-native-scroll]",
  ".home-reviews-carousel__viewport",
].join(", ");

const TEXT_INPUT_TYPES = new Set(["text", "tel", "email", "password", "search", "url"]);
const SCROLLABLE_OVERFLOW = new Set(["auto", "scroll", "overlay"]);

export const shouldKeepNativeScroll = (element) => {
  if (element.matches(NATIVE_SCROLL_SELECTOR)) return true;
  // Number/range/date controls retain wheel editing. Plain text fields have no
  // vertical scroll of their own and must not make page scrolling jump.
  if (element.tagName === "INPUT") return !TEXT_INPUT_TYPES.has(element.type);
  if (element.tagName !== "TEXTAREA") return false;
  const style = getComputedStyle(element);
  // Read fresh metrics: typing or resizing can introduce overflow immediately,
  // before Lenis's nested-scroll geometry cache is refreshed.
  return (SCROLLABLE_OVERFLOW.has(style.overflowY) && element.scrollHeight > element.clientHeight + 1)
    || (SCROLLABLE_OVERFLOW.has(style.overflowX) && element.scrollWidth > element.clientWidth + 1);
};
