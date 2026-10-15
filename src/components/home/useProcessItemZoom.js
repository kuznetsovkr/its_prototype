import { useLayoutEffect } from "react";

const layoutTop = (element, section) => {
  let top = 0;
  for (let current = element; current && current !== section; current = current.offsetParent) top += current.offsetTop;
  return top;
};

export const processItemScale = ({ entry, index, breakpoint, reduced = false }) => {
  if (reduced) return 1;
  const distance = breakpoint === "mobile" ? 180 : breakpoint === "tablet" ? 260 : 320;
  const delay = breakpoint === "mobile" ? (index % 2) * 30 : index * 50;
  return 0.8 + 0.2 * Math.min(1, Math.max(0, (entry - delay) / distance));
};

const useProcessItemZoom = (sectionRef, breakpoint) => {
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;
    const items = [...section.querySelectorAll(".home-process__visual, .home-process__description")];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const previous = [];
    let frame = 0;
    const update = () => {
      frame = 0;
      const top = section.getBoundingClientRect().top;
      items.forEach((item, index) => {
        const value = processItemScale({ entry: window.innerHeight - top - layoutTop(item, section), index, breakpoint, reduced: reducedMotion.matches });
        if (previous[index] !== value) item.style.setProperty("--home-process-item-scale", String(value));
        previous[index] = value;
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reducedMotion.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reducedMotion.removeEventListener("change", schedule);
      items.forEach((item) => item.style.removeProperty("--home-process-item-scale"));
    };
  }, [sectionRef, breakpoint]);
};
export default useProcessItemZoom;
