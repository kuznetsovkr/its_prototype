import { socialLinks } from "../../data/homeContent";
import LayeredAsset from "./LayeredAsset";
import { HomeButton } from "./primitives";

const SocialSection = ({ items }) => (
  <section className="home-section home-social" id="social" aria-labelledby="home-social-title">
    <div className="home-section__surface home-social__surface">
      <div className="home-section__inner home-social__inner">
        <h2 className="home-section__title" id="home-social-title">мы в соцсетях</h2>
        <div className="home-social__feed">
          {items.map((item, index) => (
            <LayeredAsset
              className={`home-social__item home-social__item--${index + 1}`}
              layers={item.layers || [item]}
              label={`Публикация бренда ${index + 1}`}
              key={index}
            />
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

export default SocialSection;
