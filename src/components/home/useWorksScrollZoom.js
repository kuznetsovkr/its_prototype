import { useLayoutEffect, useRef } from "react";

// Initial sizes follow the intermediate gallery frame in Figma; pixel offsets vary the timing.
const zoomProfiles = [
  { start: 0.90, delay: 0, distance: 560 },
  { start: 1, delay: 0, distance: 560 },
  { start: 0.90, delay: 70, distance: 480 },
  { start: 0.79, delay: 30, distance: 630 },
  { start: 0.67, delay: 120, distance: 500 },
  { start: 0.85, delay: 55, distance: 590 },
  { start: 0.86, delay: 90, distance: 540 },
  { start: 1, delay: 0, distance: 560 },
  { start: 0.825, delay: 25, distance: 650 },
];

const clamp = (value) => Math.min(1, Math.max(0, value));

const useWorksScrollZoom = ({ itemCount, breakpoint }) => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const cards = [...section.querySelectorAll(".home-works__item")];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const distanceFactor = breakpoint === "mobile" ? 0.6 : breakpoint === "tablet" ? 0.8 : 1;
    const delayFactor = breakpoint === "mobile" ? 0.5 : breakpoint === "tablet" ? 0.75 : 1;
    const lastScales = Array(cards.length);
    let frame = 0;

    const getStartScale = (index) => {
      const start = zoomProfiles[index % zoomProfiles.length].start;
      return breakpoint === "mobile" ? Math.max(0.8, start) : start;
    };

    const applyScales = (scales) => {
      cards.forEach((card, index) => {
        if (scales[index] !== lastScales[index]) {
          card.style.setProperty("--home-work-scroll-scale", String(scales[index]));
          lastScales[index] = scales[index];
        }
      });
    };

    const update = () => {
      frame = 0;
      if (reducedMotion.matches) {
        applyScales(cards.map(() => 1));
        return;
      }

      const sectionRect = section.getBoundingClientRect();
      if (sectionRect.top > window.innerHeight + 800) {
        applyScales(cards.map((_, index) => getStartScale(index)));
        return;
      }
      if (sectionRect.bottom < -800) {
        applyScales(cards.map(() => 1));
        return;
      }

      const scales = cards.map((card, index) => {
        const profile = zoomProfiles[index % zoomProfiles.length];
        const rect = card.getBoundingClientRect();
        const layoutTop = rect.top - (card.offsetHeight - rect.height) / 2;
        const progress = clamp((window.innerHeight - layoutTop - profile.delay * delayFactor) / (profile.distance * distanceFactor));
        const start = getStartScale(index);
        return start + (1 - start) * progress;
      });
      applyScales(scales);
    };

    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    reducedMotion.addEventListener("change", scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      reducedMotion.removeEventListener("change", scheduleUpdate);
      cards.forEach((card) => card.style.removeProperty("--home-work-scroll-scale"));
    };
  }, [itemCount, breakpoint]);

  return sectionRef;
};

export default useWorksScrollZoom;
