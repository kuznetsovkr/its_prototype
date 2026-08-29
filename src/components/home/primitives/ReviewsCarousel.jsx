import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import HomeButton from "./HomeButton";


const getDefaultReviewKey = (review, index) => (
  review && typeof review === "object" && review.id !== undefined
    ? review.id
    : index
);

const pagesAreEqual = (firstPages, secondPages) => (
  firstPages.length === secondPages.length
  && firstPages.every((page, index) => (
    Math.abs(page.position - secondPages[index].position) < 1
    && page.itemIndex === secondPages[index].itemIndex
  ))
);

const ReviewsCarousel = forwardRef(({
  ariaLabel = "Отзывы клиентов",
  className = "",
  getReviewKey = getDefaultReviewKey,
  nextLabel = "Следующие отзывы",
  onActiveIndexChange,
  previousLabel = "Предыдущие отзывы",
  renderReview,
  reviews = [],
  scrollBehavior = "smooth",
  showControls = true,
  showDots = false,
}, forwardedRef) => {
  const generatedId = useId().replace(/:/g, "");
  const viewportId = `home-reviews-carousel-${generatedId}`;
  const viewportRef = useRef(null);
  const [pages, setPages] = useState([{ itemIndex: 0, position: 0 }]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(reviews.length > 1);
  const lastReportedItemIndex = useRef(null);

  const getResolvedScrollBehavior = useCallback(() => {
    if (
      typeof window !== "undefined"
      && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return "auto";
    }

    return scrollBehavior;
  }, [scrollBehavior]);

  const scrollToPosition = useCallback((position) => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    if (typeof viewport.scrollTo === "function") {
      viewport.scrollTo({
        behavior: getResolvedScrollBehavior(),
        left: position,
      });
    } else {
      viewport.scrollLeft = position;
    }
  }, [getResolvedScrollBehavior]);

  const scrollToItem = useCallback((itemIndex) => {
    const viewport = viewportRef.current;
    const track = viewport?.querySelector(".home-reviews-carousel__track");
    const items = track ? Array.from(track.children) : [];
    const item = items[itemIndex];
    const firstItem = items[0];

    if (!viewport || !item || !firstItem) {
      return;
    }

    const maximumScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const targetPosition = Math.min(
      Math.max(0, item.offsetLeft - firstItem.offsetLeft),
      maximumScroll,
    );
    scrollToPosition(targetPosition);
  }, [scrollToPosition]);

  const scrollToPage = useCallback((pageIndex) => {
    if (pages.length === 0) {
      return;
    }

    const boundedIndex = Math.min(Math.max(pageIndex, 0), pages.length - 1);
    scrollToPosition(pages[boundedIndex].position);
  }, [pages, scrollToPosition]);

  useImperativeHandle(forwardedRef, () => ({
    getViewport: () => viewportRef.current,
    next: () => scrollToPage(activePageIndex + 1),
    previous: () => scrollToPage(activePageIndex - 1),
    scrollToIndex: scrollToItem,
  }), [activePageIndex, scrollToItem, scrollToPage]);

  const updatePosition = useCallback((availablePages = pages) => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const maximumScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const currentPosition = viewport.scrollLeft;
    let closestPageIndex = 0;

    availablePages.forEach((page, index) => {
      const closestDistance = Math.abs(
        availablePages[closestPageIndex].position - currentPosition,
      );
      const candidateDistance = Math.abs(page.position - currentPosition);

      if (candidateDistance < closestDistance) {
        closestPageIndex = index;
      }
    });

    setActivePageIndex(closestPageIndex);
    setCanScrollPrevious(currentPosition > 1);
    setCanScrollNext(currentPosition < maximumScroll - 1);

    const activeItemIndex = availablePages[closestPageIndex]?.itemIndex ?? 0;
    if (activeItemIndex !== lastReportedItemIndex.current) {
      lastReportedItemIndex.current = activeItemIndex;
      onActiveIndexChange?.(activeItemIndex);
    }
  }, [onActiveIndexChange, pages]);

  const recalculatePages = useCallback(() => {
    const viewport = viewportRef.current;
    const track = viewport?.querySelector(".home-reviews-carousel__track");
    const items = track ? Array.from(track.children) : [];

    if (!viewport || items.length === 0) {
      const emptyPages = [{ itemIndex: 0, position: 0 }];
      setPages((currentPages) => (
        pagesAreEqual(currentPages, emptyPages) ? currentPages : emptyPages
      ));
      setCanScrollPrevious(false);
      setCanScrollNext(false);
      return;
    }

    const firstItemOffset = items[0].offsetLeft;
    const maximumScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const nextPages = [];

    items.forEach((item, itemIndex) => {
      const position = Math.min(
        Math.max(0, item.offsetLeft - firstItemOffset),
        maximumScroll,
      );
      const previousPage = nextPages[nextPages.length - 1];

      if (!previousPage || Math.abs(previousPage.position - position) >= 1) {
        nextPages.push({ itemIndex, position });
      }
    });

    setPages((currentPages) => (
      pagesAreEqual(currentPages, nextPages) ? currentPages : nextPages
    ));
    updatePosition(nextPages);
  }, [updatePosition]);

  useEffect(() => {
    recalculatePages();
    const viewport = viewportRef.current;
    const track = viewport?.querySelector(".home-reviews-carousel__track");
    let resizeObserver;

    if (typeof ResizeObserver !== "undefined" && viewport && track) {
      resizeObserver = new ResizeObserver(recalculatePages);
      resizeObserver.observe(viewport);
      resizeObserver.observe(track);
    } else if (typeof window !== "undefined") {
      window.addEventListener("resize", recalculatePages);
    }

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener?.("resize", recalculatePages);
    };
  }, [recalculatePages, reviews.length]);

  const classes = ["home-reviews-carousel", className].filter(Boolean).join(" ");

  return (
    <section
      aria-label={ariaLabel}
      aria-roledescription="карусель"
      className={classes}
    >
      <div
        className="home-reviews-carousel__viewport"
        id={viewportId}
        onScroll={() => updatePosition()}
        ref={viewportRef}
        tabIndex={0}
      >
        <ul className="home-reviews-carousel__track">
          {reviews.map((review, index) => (
            <li
              aria-label={`${index + 1} из ${reviews.length}`}
              aria-roledescription="слайд"
              className="home-reviews-carousel__item"
              key={getReviewKey(review, index)}
              role="group"
            >
              {renderReview ? renderReview(review, index) : review}
            </li>
          ))}
        </ul>
      </div>

      {showControls && (
        <div className="home-reviews-carousel__controls">
          <HomeButton
            aria-controls={viewportId}
            aria-label={previousLabel}
            className="home-reviews-carousel__previous"
            disabled={!canScrollPrevious}
            onClick={() => scrollToPage(activePageIndex - 1)}
            size="icon"
            variant="carousel"
          >
            <span aria-hidden="true">←</span>
          </HomeButton>
          <HomeButton
            aria-controls={viewportId}
            aria-label={nextLabel}
            className="home-reviews-carousel__next"
            disabled={!canScrollNext}
            onClick={() => scrollToPage(activePageIndex + 1)}
            size="icon"
            variant="carousel"
          >
            <span aria-hidden="true">→</span>
          </HomeButton>
        </div>
      )}

      {showDots && pages.length > 1 && (
        <div aria-label="Навигация по отзывам" className="home-reviews-carousel__dots">
          {pages.map((page, pageIndex) => (
            <button
              aria-label={`Перейти к странице ${pageIndex + 1}`}
              aria-pressed={pageIndex === activePageIndex}
              className={[
                "home-reviews-carousel__dot",
                pageIndex === activePageIndex
                  ? "home-reviews-carousel__dot--active"
                  : "",
              ].filter(Boolean).join(" ")}
              key={`${page.itemIndex}-${page.position}`}
              onClick={() => scrollToPage(pageIndex)}
              type="button"
            />
          ))}
        </div>
      )}
    </section>
  );
});

ReviewsCarousel.displayName = "ReviewsCarousel";

export default ReviewsCarousel;
