import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  DESKTOP_SCROLL_OPTIONS,
  DESKTOP_SCROLL_QUERY,
  NATIVE_SCROLL_SELECTOR,
  shouldSmoothWheel,
} from "../config/desktopScroll";

const DesktopSmoothScroll = () => {
  const { key: locationKey } = useLocation();

  useLayoutEffect(() => {
    const desktop = window.matchMedia(DESKTOP_SCROLL_QUERY);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let instance;
    let disposed = false;
    let loading = false;

    const isEnabled = () => desktop.matches && !reducedMotion.matches && !disposed;
    const isPageLocked = () => [document.documentElement, document.body].some((element) => (
      ["hidden", "clip"].includes(element.style.overflowY)
    ));

    const updateLock = () => {
      if (!instance) return;
      if (isPageLocked()) instance.stop();
      else if (instance.isStopped) instance.start();
    };

    const cancelInertia = () => {
      if (instance && !instance.isStopped) {
        instance.scrollTo(window.scrollY, { immediate: true });
      }
    };

    const update = async () => {
      if (!isEnabled()) {
        instance?.destroy();
        instance = undefined;
        return;
      }
      if (instance || loading) return;

      loading = true;
      try {
        // Load the enhancement only on eligible desktops, without an external CDN.
        const { default: Lenis } = await import("lenis");
        if (!isEnabled()) return;
        instance = new Lenis({
          ...DESKTOP_SCROLL_OPTIONS,
          prevent: (element) => element.matches(NATIVE_SCROLL_SELECTOR),
          virtualScroll: ({ event }) => {
            const smooth = shouldSmoothWheel(event);
            if (!smooth) cancelInertia();
            return smooth;
          },
        });
        updateLock();
      } catch {
        // Failed optional chunks must not prevent native scrolling or navigation.
      } finally {
        loading = false;
      }
    };

    // Existing modals lock <html>/<body>; stop any in-flight inertia immediately.
    const observer = new MutationObserver(updateLock);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });

    const stopForLink = (event) => {
      // Preserve native anchors and their existing sticky-header offsets.
      if (event.target.closest?.("a[href]")) cancelInertia();
    };

    desktop.addEventListener("change", update);
    reducedMotion.addEventListener("change", update);
    window.addEventListener("keydown", cancelInertia, { capture: true });
    window.addEventListener("click", stopForLink, { capture: true });
    update();

    return () => {
      disposed = true;
      observer.disconnect();
      desktop.removeEventListener("change", update);
      reducedMotion.removeEventListener("change", update);
      window.removeEventListener("keydown", cancelInertia, { capture: true });
      window.removeEventListener("click", stopForLink, { capture: true });
      instance?.destroy();
    };
  }, [locationKey]);

  return null;
};

export default DesktopSmoothScroll;
