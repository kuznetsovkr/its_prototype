import { useEffect, useRef, useState } from "react";
import useScrollZoom from "./useScrollZoom";

const AboutSection = ({ photos, onOrder }) => {
  const sectionRef = useScrollZoom();
  const photoRef = useRef(null);
  const [photoChangeCount, setPhotoChangeCount] = useState(0);

  useEffect(() => {
    const photo = photoRef.current;
    if (!photo || photos.length < 2) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let intervalId;
    let isVisible = false;

    const stop = () => window.clearInterval(intervalId);
    const updatePlayback = () => {
      stop();
      if (isVisible && !document.hidden && !reducedMotion.matches) {
        intervalId = window.setInterval(() => setPhotoChangeCount((count) => count + 1), 5000);
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      updatePlayback();
    }, { threshold: 0.25 });

    observer.observe(photo);
    document.addEventListener("visibilitychange", updatePlayback);
    reducedMotion.addEventListener("change", updatePlayback);

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", updatePlayback);
      reducedMotion.removeEventListener("change", updatePlayback);
    };
  }, [photos.length]);

  const activePhoto = photoChangeCount % photos.length;

  return (
    <section className="home-section home-about" id="about" aria-labelledby="home-about-title" ref={sectionRef}>
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

          <div className="home-about__photo" aria-hidden="true" ref={photoRef}>
            {photos.map(({ kind, src }, index) => (
              <div
                className={`home-about__photo-slide home-about__photo-slide--${kind}${index === activePhoto ? " is-active" : ""}${index === activePhoto && photoChangeCount ? " is-entering" : ""}`}
                key={kind}
              >
                <img className="home-about__photo-image" src={src} alt="" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
