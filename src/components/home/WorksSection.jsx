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
  const initialItems = assets.initialItems || [];
  const additionalItems = assets.additionalItems || [];
  const canExpand = additionalItems.length > 0;
  const items = isExpanded ? [...initialItems, ...additionalItems] : initialItems;

  return (
    <section
      className={`home-section home-works home-works--${breakpoint}${isExpanded ? " is-expanded" : ""}`}
      id="works"
      aria-labelledby="home-works-title"
    >
      <div className="home-section__surface home-works__surface">
        <div className="home-section__inner home-works__inner">
          <div className="home-works__heading">
            {assets.headingAvatar && <img className="home-works__avatar" src={assets.headingAvatar} alt="" />}
            <h2 className="home-section__title" id="home-works-title">примеры работ</h2>
            {assets.headingStickers.map((sticker, index) => (
              <img className={`home-works__sticker home-works__sticker--${index + 1}`} src={sticker} alt="" key={sticker} />
            ))}
          </div>

          <div className="home-works__grid" id="home-works-gallery">
            {items.map((item, index) => {
              const additionalIndex = index - initialItems.length + 1;
              const isAdditional = additionalIndex > 0;
              const itemClassName = [
                "home-works__item",
                `home-works__item--${index + 1}`,
                isAdditional ? "home-works__item--additional" : "",
                isAdditional ? `home-works__item--more-${additionalIndex}` : "",
              ].filter(Boolean).join(" ");

              return (
                <figure
                  className={itemClassName}
                  key={`${breakpoint}-${isAdditional ? "more" : "initial"}-${isAdditional ? additionalIndex : index}`}
                  style={isAdditional ? { "--home-work-reveal-index": additionalIndex } : undefined}
                >
                  <LayeredAsset
                    layers={item.layers || [item]}
                    label={workLabels[index] || `Пример работы ${index + 1}`}
                  />
                </figure>
              );
            })}
          </div>

          <div className="home-works__actions">
            {canExpand && (
              <HomeButton
                className="home-works__more"
                variant="dark"
                size="medium"
                aria-controls="home-works-gallery"
                aria-expanded={isExpanded}
                onClick={() => setIsExpanded((value) => !value)}
              >
                {isExpanded ? "Скрыть примеры" : "Ещё примеры"}
              </HomeButton>
            )}
            <HomeButton variant="accent" size="medium" onClick={onOrder}>Сделать заказ</HomeButton>
            <span className="home-visually-hidden" aria-live="polite">
              {isExpanded ? `Показано ещё ${additionalItems.length} примеров работ` : ""}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorksSection;
