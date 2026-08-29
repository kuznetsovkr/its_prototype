import { socialLinks } from "../../data/homeContent";
import ResponsiveAsset from "./ResponsiveAsset";
import { HomeButton } from "./primitives";

const QuestionsSection = ({ assets }) => (
  <section className="home-section home-questions" id="questions" aria-labelledby="home-questions-title">
    <div className="home-section__surface home-questions__surface">
      <div className="home-questions__card">
        <h2 className="home-questions__title" id="home-questions-title">остались вопросы?</h2>
        <p>напиши нам в telegram</p>
        <HomeButton
          href={socialLinks.telegram}
          target="_blank"
          rel="noreferrer"
          variant="accent"
          size="medium"
        >
          Написать
        </HomeButton>
      </div>

      {assets.dogs.map((dog, index) => (
        <ResponsiveAsset
          desktop={dog.desktop}
          tablet={dog.tablet}
          mobile={dog.mobile}
          alt=""
          className={`home-questions__dog home-questions__dog--${index + 1}`}
          key={index}
        />
      ))}
    </div>
  </section>
);

export default QuestionsSection;
