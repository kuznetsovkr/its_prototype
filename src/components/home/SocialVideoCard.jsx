import { useEffect, useRef, useState } from "react";

const SocialVideoCard = ({ item, index, enabled }) => {
  const cardRef = useRef(null);
  const videoRef = useRef(null);
  const failedRef = useRef(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    const card = cardRef.current;
    const video = videoRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isVisible = false;
    let wantsPlayback = false;

    const updatePlayback = () => {
      wantsPlayback = enabled && isVisible && !document.hidden
        && !reducedMotion.matches && !failedRef.current;
      if (!wantsPlayback) {
        video.pause();
        return;
      }
      // No media request on first render, offscreen, or with reduced motion.
      if (!video.getAttribute("src")) video.src = item.src;
      video.muted = true;
      video.play().then(() => {
        // A pending play promise must not restart an offscreen/paused card.
        if (!wantsPlayback) video.pause();
      }).catch(() => {
        // Autoplay may be blocked (e.g. power-saving mode). Keep the poster.
      });
    };

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      updatePlayback();
    }, { threshold: 0.15 });
    observer.observe(card);
    document.addEventListener("visibilitychange", updatePlayback);
    reducedMotion.addEventListener("change", updatePlayback);

    return () => {
      wantsPlayback = false;
      video.pause();
      observer.disconnect();
      document.removeEventListener("visibilitychange", updatePlayback);
      reducedMotion.removeEventListener("change", updatePlayback);
    };
  }, [enabled, item.src]);

  return (
    <div
      className={`home-social__item home-social__item--${index + 1}`}
      data-social-id={item.id}
      role="img"
      aria-label={item.label}
      ref={cardRef}
    >
      <img className="home-social__poster" src={item.poster} alt="" loading="lazy" decoding="async" />
      <video
        className={`home-social__video${hasPlayed ? " is-ready" : ""}`}
        poster={item.poster}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        disablePictureInPicture
        ref={videoRef}
        onPlaying={() => setHasPlayed(true)}
        onError={() => {
          failedRef.current = true;
          setHasPlayed(false);
        }}
      />
    </div>
  );
};

export default SocialVideoCard;
