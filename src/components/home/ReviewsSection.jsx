import { useState } from "react";
import LayeredAsset from "./LayeredAsset";
import ReviewModal from "./ReviewModal";
import { HomeButton, ReviewsCarousel } from "./primitives";
import useScrollZoom from "./useScrollZoom";

const getReviewImage = (review) => (typeof review === "string"
  ? review
  : review.fullImage || review.src || review.layers?.[0]);

const ReviewsSection = ({ assets, breakpoint, onOrder }) => {
  const sectionRef = useScrollZoom();
  const [selectedReview, setSelectedReview] = useState(null);

  return (
    <section className="home-section home-reviews" id="reviews" aria-labelledby="home-reviews-title" ref={sectionRef}>
      <div className="home-section__surface home-reviews__surface">
        <div className="home-section__inner home-reviews__inner">
          <h2 className="home-section__title" id="home-reviews-title">отзывы</h2>
          <ReviewsCarousel
            className="home-reviews__carousel"
            reviews={assets.items}
            nextIcon={assets.nextArrow}
            previousIcon={assets.previousArrow}
            showControls={breakpoint === "desktop"}
            showDots={breakpoint === "desktop"}
            renderReview={(review, index) => (
              <button
                className="home-reviews__card-button"
                type="button"
                aria-haspopup="dialog"
                aria-label={`Открыть отзыв клиента ${index + 1}`}
                onClick={(event) => setSelectedReview({ index, src: getReviewImage(review), trigger: event.currentTarget })}
              >
                <LayeredAsset className="home-reviews__card" layers={review.layers || [getReviewImage(review)]} />
              </button>
            )}
          />
          <HomeButton
            className="home-reviews__all"
            onClick={onOrder}
            variant="dark"
            size="medium"
          >
            Сделать заказ
          </HomeButton>
        </div>
      </div>
      {selectedReview && (
        <ReviewModal
          index={selectedReview.index}
          src={selectedReview.src}
          onClose={() => setSelectedReview(null)}
          returnFocusTo={selectedReview.trigger}
        />
      )}
    </section>
  );
};

export default ReviewsSection;
