import ResponsiveAsset from "./ResponsiveAsset";

const HeroSection = ({ assets, onOrder }) => (
  <section className="home-hero" aria-labelledby="home-hero-title">
    <div className="home-hero__media" aria-hidden="true">
      <ResponsiveAsset
        desktop={assets.background.desktop}
        tablet={assets.background.tablet}
        mobile={assets.background.mobile}
        alt=""
        className="home-hero__background"
        loading="eager"
        fetchPriority="high"
      />
      {(assets.subject.desktop || assets.subject.tablet) && (
        <ResponsiveAsset
          desktop={assets.subject.desktop}
          tablet={assets.subject.tablet}
          alt=""
          className="home-hero__subject"
          loading="eager"
          fetchPriority="high"
        />
      )}
    </div>

    <div className="home-hero__content">
      <h1 id="home-hero-title" className="home-hero__title">
        <span className="home-visually-hidden">И так сойдёт — вышивка на одежде</span>
        <ResponsiveAsset
          desktop={assets.logo.desktop}
          tablet={assets.logo.tablet}
          mobile={assets.logo.mobile}
          alt=""
          className="home-hero__brand"
          loading="eager"
        />
      </h1>
      <p className="home-hero__subtitle">вышивка на одежде</p>
      <button className="home-button home-button--dark home-hero__order" type="button" onClick={onOrder}>
        Сделать заказ
      </button>
    </div>
  </section>
);

export default HeroSection;
