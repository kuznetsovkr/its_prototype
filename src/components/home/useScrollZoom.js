import { useLayoutEffect, useRef } from "react";

const clamp = (value) => Math.min(1, Math.max(0, value));

const useScrollZoom = ({ startScale = 0.8, distance = 560 } = {}) => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let lastScale;

    const update = () => {
      frame = 0;
      const progress = clamp((window.innerHeight - section.getBoundingClientRect().top) / distance);
      const scale = reducedMotion.matches ? 1 : startScale + (1 - startScale) * progress;
      if (scale !== lastScale) {
        section.style.setProperty("--home-scroll-zoom-scale", String(scale));
        lastScale = scale;
      }
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
      section.style.removeProperty("--home-scroll-zoom-scale");
    };
  }, [startScale, distance]);

  return sectionRef;
};

export default useScrollZoom;
