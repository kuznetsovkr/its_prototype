import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Run after the lazy home route has mounted and the mobile menu has released
// its scroll lock. The pathname-only scroll reset must not override anchors.
const useHomeAnchorScroll = () => {
  const { hash, key } = useLocation();
  useEffect(() => {
    if (!hash) return undefined;
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return undefined; }
    let frame;
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        const target = document.getElementById(id);
        if (!target) return;
        const header = document.querySelector(".home-header");
        const offset = id === "top" ? 0 : (header?.getBoundingClientRect().bottom || 0) + 16;
        const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const focusTarget = id === "top" ? target : target.querySelector("h2") || target;
        if (!focusTarget.hasAttribute("tabindex")) focusTarget.setAttribute("tabindex", "-1");
        focusTarget.focus({ preventScroll: true });
        window.scrollTo({ top, behavior: reduced ? "instant" : "smooth" });
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [hash, key]);
};

export default useHomeAnchorScroll;
