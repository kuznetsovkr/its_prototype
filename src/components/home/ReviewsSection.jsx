import { socialLinks } from "../../data/homeContent";
import LayeredAsset from "./LayeredAsset";
import { HomeButton, ReviewsCarousel } from "./primitives";

const ReviewsSection = ({ assets, breakpoint }) => (
  <section className="home-section home-reviews" id="reviews" aria-labelledby="home-reviews-title">
    <div className="home-section__surface home-reviews__surface">
      <div className="home-section__inner home-reviews__inner">
        <h2 className="home-section__title" id="home-reviews-title">отзывы</h2>
        <ReviewsCarousel
          className="home-reviews__carousel"
          reviews={assets.items}
          showControls={breakpoint === "desktop"}
          showDots={breakpoint === "desktop"}
          renderReview={(review, index) => (
            <LayeredAsset
              className="home-reviews__card"
              layers={review.layers || [review]}
              label={`Отзыв клиента ${index + 1}`}
            />
          )}
        />
        <HomeButton
          className="home-reviews__all"
          href={socialLinks.vk}
          target="_blank"
          rel="noreferrer"
          variant="accent"
          size="medium"
        >
          Все отзывы
        </HomeButton>
      </div>
    </div>
  </section>
);

export default ReviewsSection;
