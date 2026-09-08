import { useEffect, useState } from "react";
import { resolveViewportMode } from "../../config/breakpoints";

const getBreakpoint = () => {
  if (typeof window === "undefined") return "desktop";
  return resolveViewportMode(window.innerWidth);
};

const useHomeBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState(getBreakpoint);

  useEffect(() => {
    let frame = 0;
    const updateBreakpoint = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setBreakpoint(getBreakpoint()));
    };

    window.addEventListener("resize", updateBreakpoint);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateBreakpoint);
    };
  }, []);

  return breakpoint;
};

export default useHomeBreakpoint;
