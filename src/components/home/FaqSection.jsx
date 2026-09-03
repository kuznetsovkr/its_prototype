import { faqItems } from "../../data/homeContent";
import { HomeAccordion } from "./primitives";

const FaqSection = ({ breakpoint, glow }) => (
  <section className="home-section home-faq" id="faq" aria-labelledby="home-faq-title">
    <div className="home-section__surface home-faq__surface">
      {glow && <img className="home-faq__glow" src={glow} alt="" aria-hidden="true" />}
      <div className="home-section__inner home-faq__inner">
        <h2 className="home-section__title" id="home-faq-title">вопрос - ответ</h2>
        <HomeAccordion
          allowMultiple={breakpoint === "tablet"}
          className="home-faq__accordion"
          defaultOpenItemId={breakpoint === "mobile" ? faqItems[0].id : null}
          items={faqItems}
          key={breakpoint}
          renderIndicator={() => null}
        />
      </div>
    </div>
  </section>
);

export default FaqSection;
