import { useEffect, useState } from "react";

const getBreakpoint = () => {
  if (typeof window === "undefined") return "desktop";
  if (window.innerWidth < 640) return "mobile";
  if (window.innerWidth < 1200) return "tablet";
  return "desktop";
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
