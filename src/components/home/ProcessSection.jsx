import { processSteps } from "../../data/homeContent";
import ResponsiveAsset from "./ResponsiveAsset";

const ProcessSection = ({ assets, onOrder }) => (
  <section className="home-section home-process" id="process" aria-labelledby="home-process-title">
    <div className="home-section__surface home-process__surface">
      <div className="home-section__inner home-process__inner">
        <h2 className="home-section__title" id="home-process-title">процесс</h2>
        <div className="home-process__flow">
          {processSteps.map((step, index) => (
            <article className={`home-process__step home-process__step--${index + 1}`} key={step.id}>
              <div className="home-process__visual">
                <ResponsiveAsset
                  desktop={assets.desktop[index]}
                  mobile={assets.mobile[index]}
                  alt={`${step.label}: этап создания вышивки`}
                  className="home-process__image"
                />
                <span className="home-process__label">{step.label}</span>
              </div>
              <div className="home-process__description">
                <span className="home-process__number" aria-hidden="true">{index + 1}</span>
                <p>{step.text}</p>
              </div>
              {index < processSteps.length - 1 && assets.connector && (
                <img className="home-process__connector" src={assets.connector} alt="" aria-hidden="true" />
              )}
            </article>
          ))}
        </div>
        <button className="home-button home-button--accent home-process__order" type="button" onClick={onOrder}>
          Сделать заказ
        </button>
      </div>
    </div>
  </section>
);

export default ProcessSection;
