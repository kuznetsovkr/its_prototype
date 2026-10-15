import { useRef, useState } from "react";
import LayeredAsset from "./LayeredAsset";
import ReviewModal from "./ReviewModal";
import { HomeButton, ReviewsCarousel } from "./primitives";
import useScrollZoom from "./useScrollZoom";

const getReviewImage = (review) => (typeof review === "string"
  ? review
  : review.fullImage || review.src || review.layers?.[0]);

const ReviewsSection = ({ assets, breakpoint, onOrder }) => {
  const sectionRef = useScrollZoom();
  const carouselRef = useRef(null);
  const [selectedReview, setSelectedReview] = useState(null);

  return (
    <section className="home-section home-reviews" id="reviews" aria-labelledby="home-reviews-title" ref={sectionRef}>
      <div className="home-section__surface home-reviews__surface">
        <div className="home-section__inner home-reviews__inner">
          <h2 className="home-section__title" id="home-reviews-title">отзывы</h2>
          <ReviewsCarousel
            ref={carouselRef}
            className="home-reviews__carousel"
            loop
            reviews={assets.items}
            nextIcon={assets.nextArrow}
            previousIcon={assets.previousArrow}
            showControls={breakpoint === "desktop"}
            showDots={breakpoint === "desktop"}
            renderReview={(review, index, { clone }) => (
              <button
                className={`home-reviews__card-control home-reviews__${clone ? "clone-button" : "card-button"}`}
                tabIndex={clone ? -1 : undefined}
                type="button"
                aria-haspopup="dialog"
                aria-label={`Открыть отзыв клиента ${index + 1}`}
                onClick={(event) => {
                  const trigger = clone
                    ? event.currentTarget.closest(".home-reviews-carousel").querySelectorAll(".home-reviews__card-button")[index]
                    : event.currentTarget;
                  setSelectedReview({ index, src: getReviewImage(review), trigger, clone });
                }}
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
          onClose={() => {
            // The modal restores focus without scrolling. Make the canonical
            // button visible before returning focus from a clicked loop copy.
            if (selectedReview.clone) carouselRef.current?.scrollToIndex(selectedReview.index, { instant: true });
            setSelectedReview(null);
          }}
          returnFocusTo={selectedReview.trigger}
        />
      )}
    </section>
  );
};

export default ReviewsSection;
