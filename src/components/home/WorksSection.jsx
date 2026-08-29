import { useState } from "react";
import { HomeButton } from "./primitives";
import LayeredAsset from "./LayeredAsset";

const workLabels = [
  "Вышивка кота на голубом изделии",
  "Автомобиль DeLorean",
  "Портреты собак на бордовом изделии",
  "Вышитый портрет",
  "Вышивка корги",
  "Белая собака на сером изделии",
  "Портрет человека с собакой",
  "Собака с футбольным мячом",
  "Портрет собаки на синем изделии",
];

const WorksSection = ({ assets, breakpoint, onOrder }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const canExpand = breakpoint === "tablet" && assets.expandedItems.length > assets.compactItems.length;
  const items = breakpoint === "desktop"
    ? assets.desktopItems
    : breakpoint === "tablet"
      ? isExpanded ? assets.expandedItems : assets.compactItems
      : assets.mobileItems;

  return (
    <section className={`home-section home-works home-works--${breakpoint}`} id="works" aria-labelledby="home-works-title">
      <div className="home-section__surface home-works__surface">
        <div className="home-section__inner home-works__inner">
          <div className="home-works__heading">
            {assets.headingAvatar && <img className="home-works__avatar" src={assets.headingAvatar} alt="" />}
            <h2 className="home-section__title" id="home-works-title">примеры работ</h2>
            {assets.headingStickers.map((sticker, index) => (
              <img className={`home-works__sticker home-works__sticker--${index + 1}`} src={sticker} alt="" key={sticker} />
            ))}
          </div>

          <div className="home-works__grid">
            {items.map((item, index) => (
              <figure className={`home-works__item home-works__item--${index + 1}`} key={`${breakpoint}-${index}`}>
                <LayeredAsset layers={item.layers || [item]} label={workLabels[index % workLabels.length]} />
              </figure>
            ))}
          </div>

          <div className="home-works__actions">
            {canExpand ? (
              <HomeButton variant="dark" size="medium" onClick={() => setIsExpanded((value) => !value)}>
                {isExpanded ? "Скрыть примеры" : "Ещё примеры"}
              </HomeButton>
            ) : (
              <HomeButton href="/works" variant="dark" size="medium">Ещё примеры</HomeButton>
            )}
            <HomeButton variant="accent" size="medium" onClick={onOrder}>Сделать заказ</HomeButton>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorksSection;
