import ResponsiveAsset from "./ResponsiveAsset";

const AboutSection = ({ assets, onOrder }) => (
  <section className="home-section home-about" id="about" aria-labelledby="home-about-title">
    <div className="home-section__surface home-about__surface">
      <div className="home-about__card">
        <div className="home-about__copy">
          <h2 className="home-section__title home-about__title" id="home-about-title">о бренде</h2>
          <div className="home-about__text">
            <div className="home-about__text-copy home-about__text-copy--default">
              <p>Привет! Мы бренд кастомной вышивки из Красноярска</p>
              <p>Каждое наше изделие создается индивидуально - от идеи к финальному результату.</p>
              <p>В своей работе мы делаем акцент на качестве, деталях и очень ценим творчество.</p>
              <p>
                Нам нравится создавать вещи, которых нет на полках обычных магазинов. Вещи,
                которые вызывают эмоции, что-то значат для человека и становятся чем-то большим,
                чем просто одежда
              </p>
            </div>
            <div className="home-about__text-copy home-about__text-copy--mobile">
              <p>Привет!</p>
              <p>Мы бренд кастомной вышивки из Красноярска</p>
              <p>
                Каждое наше изделие создается индивидуально - от идеи к финальному результату.
                <br />
                <br />
                В своей работе мы делаем акцент на качестве, деталях и очень ценим творчество.
              </p>
              <p>
                Нам нравится создавать вещи, которых нет на полках обычных магазинов. Вещи,
                которые вызывают эмоции, что-то значат для человека и становятся чем-то большим,
                чем просто одежда
              </p>
            </div>
          </div>
          <button className="home-button home-button--accent home-about__order" type="button" onClick={onOrder}>
            Сделать заказ
          </button>
        </div>

        <div className="home-about__photo" aria-hidden="true">
          <ResponsiveAsset
            desktop={assets.primary.desktop}
            tablet={assets.primary.tablet}
            mobile={assets.primary.mobile}
            alt=""
            className="home-about__photo-image"
          />
          {assets.overlay.mobile && (
            <img className="home-about__photo-overlay" src={assets.overlay.mobile} alt="" loading="lazy" />
          )}
        </div>
      </div>
    </div>
  </section>
);

export default AboutSection;
