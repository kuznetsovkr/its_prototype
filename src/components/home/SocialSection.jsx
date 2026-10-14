import { useState } from "react";
import { socialLinks } from "../../data/homeContent";
import SocialVideoCard from "./SocialVideoCard";
import { HomeButton } from "./primitives";
import useScrollZoom from "./useScrollZoom";

const SocialSection = ({ items }) => {
  const sectionRef = useScrollZoom();
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  return (
    <section className="home-section home-social" id="social" aria-labelledby="home-social-title" ref={sectionRef}>
      <div className="home-section__surface home-social__surface">
        <div className="home-section__inner home-social__inner">
          <h2 className="home-section__title" id="home-social-title">мы в соцсетях</h2>
          <button
            type="button"
            className="home-social__motion-toggle"
            aria-label={animationsEnabled ? "Приостановить анимацию публикаций" : "Возобновить анимацию публикаций"}
            aria-pressed={!animationsEnabled}
            onClick={() => setAnimationsEnabled((enabled) => !enabled)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              {animationsEnabled
                ? <path d="M9 6v12M15 6v12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                : <path d="m9 6 9 6-9 6z" fill="currentColor" />}
            </svg>
          </button>
          <div className="home-social__feed">
            {items.map((item, index) => (
              <SocialVideoCard item={item} index={index} enabled={animationsEnabled} key={item.id} />
            ))}
          </div>
          <div className="home-social__actions">
            <HomeButton href={socialLinks.telegram} target="_blank" rel="noreferrer" variant="accent">Telegram</HomeButton>
            <HomeButton href={socialLinks.instagram} target="_blank" rel="noreferrer" variant="accent">Instagram*</HomeButton>
            <HomeButton href={socialLinks.vk} target="_blank" rel="noreferrer" variant="accent">ВКонтакте</HomeButton>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialSection;
