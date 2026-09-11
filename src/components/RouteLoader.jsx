import { useEffect, useState } from "react";
import loaderLogo from "../images/route-loader-logo.png";
import loaderGlow from "../images/route-loader-glow.svg";

const DEFAULT_REVEAL_DELAY = 180;

const nextProgress = (current) => {
  if (current >= 99) return 99;

  const step = Math.max(1, Math.ceil((99 - current) * 0.08));
  return Math.min(99, current + step);
};

const RouteLoader = ({ delay = DEFAULT_REVEAL_DELAY }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    const revealTimer = window.setTimeout(() => setIsVisible(true), delay);

    return () => window.clearTimeout(revealTimer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return undefined;

    const progressTimer = window.setInterval(() => {
      setProgress(nextProgress);
    }, 140);

    return () => window.clearInterval(progressTimer);
  }, [isVisible]);

  return (
    <div
      className={`route-loader${isVisible ? " route-loader--visible" : ""}`}
      role={isVisible ? "status" : undefined}
      aria-hidden={!isVisible}
      aria-live={isVisible ? "polite" : undefined}
    >
      <img className="route-loader__glow" src={loaderGlow} alt="" aria-hidden="true" />
      <img
        className="route-loader__logo"
        src={loaderLogo}
        width="295"
        height="130"
        alt="И так сойдёт"
      />
      <span className="route-loader__progress">Загрузка {progress}%</span>
    </div>
  );
};

export default RouteLoader;
