import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import HomeButton from "./HomeButton";
import { closestReviewPage, wrapReviewPosition } from "./reviewsLoop";

const getDefaultReviewKey = (review, index) => review?.id ?? index;

const ReviewsCarousel = forwardRef(({
  ariaLabel = "Отзывы клиентов",
  className = "",
  getReviewKey = getDefaultReviewKey,
  loop = false,
  nextIcon,
  nextLabel = "Следующие отзывы",
  onActiveIndexChange,
  previousIcon,
  previousLabel = "Предыдущие отзывы",
  renderReview,
  reviews = [],
  scrollBehavior = "smooth",
  showControls = true,
  showDots = false,
}, forwardedRef) => {
  const viewportId = `home-reviews-carousel-${useId().replace(/:/g, "")}`;
  const viewportRef = useRef(null);
  const geometry = useRef({ start: 0, span: 0, loop: false, pages: [] });
  const activeIndexRef = useRef(0);
  const settleTimer = useRef(0);
  const pendingScrollTarget = useRef(null);
  const touching = useRef(false);
  const changeCallback = useRef(onActiveIndexChange);
  const [renderLoop, setRenderLoop] = useState(loop && reviews.length > 1);
  const [pages, setPages] = useState([]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [scrollable, setScrollable] = useState(false);
  changeCallback.current = onActiveIndexChange;

  const scrollToPosition = useCallback((left, instant = false) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior = instant || reduced ? "instant" : scrollBehavior;
    pendingScrollTarget.current = behavior === "smooth" ? left : null;
    viewport.scrollTo({ left, behavior });
  }, [scrollBehavior]);

  const updatePosition = useCallback(() => {
    const viewport = viewportRef.current;
    const metrics = geometry.current;
    if (!viewport || !metrics.pages.length) return;
    const index = closestReviewPage(viewport.scrollLeft, metrics);
    const changed = activeIndexRef.current !== index;
    activeIndexRef.current = index;
    setActivePageIndex(index);
    if (changed) changeCallback.current?.(metrics.pages[index].itemIndex);
  }, []);

  const settle = useCallback(() => {
    // Keep gestures native; rebase copies only after the gesture/snap finishes.
    clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const viewport = viewportRef.current;
      const metrics = geometry.current;
      if (!viewport || touching.current || !metrics.loop) return;
      // A busy browser can pause scroll events for longer than the debounce.
      // Rebasing a copy before native smooth scrolling reaches its destination
      // cancels that animation and can send the previous arrow back to index 0.
      if (pendingScrollTarget.current !== null
        && Math.abs(viewport.scrollLeft - pendingScrollTarget.current) > 1) return;
      pendingScrollTarget.current = null;
      const canonical = wrapReviewPosition(viewport.scrollLeft, metrics.start, metrics.span);
      if (Math.abs(canonical - viewport.scrollLeft) > 1) scrollToPosition(canonical, true);
    }, 180);
  }, [scrollToPosition]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;
    const recalculate = () => {
      const items = [...viewport.querySelectorAll(".home-reviews-carousel__item")];
      const firstSlide = viewport.querySelector(".home-reviews-carousel__slide");
      if (!items.length || !firstSlide) return;
      const contentWidth = items.at(-1).offsetLeft + items.at(-1).offsetWidth - items[0].offsetLeft;
      const canScroll = contentWidth > viewport.clientWidth + 1;
      const shouldLoop = loop && items.length > 1 && canScroll;
      if (renderLoop !== shouldLoop) {
        setRenderLoop(shouldLoop);
        return;
      }
      const start = items[0].offsetLeft - firstSlide.offsetLeft;
      const stride = items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : 0;
      const span = stride * items.length;
      const maximum = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      const nextPages = [];
      items.forEach((item, itemIndex) => {
        const position = shouldLoop ? item.offsetLeft - firstSlide.offsetLeft : Math.min(item.offsetLeft - firstSlide.offsetLeft, maximum);
        if (!nextPages.length || Math.abs(nextPages.at(-1).position - position) >= 1) nextPages.push({ itemIndex, position });
      });
      const previous = geometry.current;
      const changed = previous.loop !== shouldLoop || previous.start !== start || previous.span !== span || previous.maximum !== maximum;
      geometry.current = { start, span, pages: nextPages, loop: shouldLoop, maximum };
      setPages((current) => JSON.stringify(current) === JSON.stringify(nextPages) ? current : nextPages);
      setScrollable(canScroll);
      if (changed) scrollToPosition(nextPages[Math.min(activeIndexRef.current, nextPages.length - 1)]?.position ?? 0, true);
      updatePosition();
    };
    recalculate();
    const observer = new ResizeObserver(recalculate);
    observer.observe(viewport);
    observer.observe(viewport.querySelector(".home-reviews-carousel__track"));
    return () => { observer.disconnect(); clearTimeout(settleTimer.current); };
  }, [loop, renderLoop, reviews.length, scrollToPosition, updatePosition]);

  useEffect(() => { changeCallback.current?.(geometry.current.pages[activeIndexRef.current]?.itemIndex ?? 0); }, []);

  const scrollToPage = useCallback((requestedIndex) => {
    const metrics = geometry.current;
    if (!metrics.pages.length) return;
    let index = requestedIndex;
    let shift = 0;
    if (metrics.loop) {
      const viewport = viewportRef.current;
      const canonical = wrapReviewPosition(viewport.scrollLeft, metrics.start, metrics.span);
      if (Math.abs(canonical - viewport.scrollLeft) > 1) scrollToPosition(canonical, true);
      index = ((index % metrics.pages.length) + metrics.pages.length) % metrics.pages.length;
      if (requestedIndex < 0) shift = -metrics.span;
      if (requestedIndex >= metrics.pages.length) shift = metrics.span;
    } else index = Math.min(Math.max(index, 0), metrics.pages.length - 1);
    scrollToPosition(metrics.pages[index].position + shift);
  }, [scrollToPosition]);

  useImperativeHandle(forwardedRef, () => ({
    getViewport: () => viewportRef.current,
    next: () => scrollToPage(activeIndexRef.current + 1),
    previous: () => scrollToPage(activeIndexRef.current - 1),
    scrollToIndex: (index, { instant = false } = {}) => {
      const found = geometry.current.pages.findIndex((page) => page.itemIndex === index);
      if (found >= 0) {
        if (instant) scrollToPosition(geometry.current.pages[found].position, true);
        else scrollToPage(found);
      }
    },
  }), [scrollToPage, scrollToPosition]);

  const onKeyDown = (event) => {
    if (event.target !== event.currentTarget) return;
    const targets = { ArrowLeft: activeIndexRef.current - 1, ArrowRight: activeIndexRef.current + 1, Home: 0, End: pages.length - 1 };
    if (targets[event.key] === undefined) return;
    event.preventDefault();
    pendingScrollTarget.current = null;
    scrollToPage(targets[event.key]);
  };
  const renderItems = (copy) => reviews.map((review, index) => (
    <li
      aria-hidden={copy !== "original" ? true : undefined}
      aria-label={copy === "original" ? `${index + 1} из ${reviews.length}` : undefined}
      aria-roledescription={copy === "original" ? "слайд" : undefined}
      className={`home-reviews-carousel__slide home-reviews-carousel__${copy === "original" ? "item" : "clone"}`}
      data-review-index={index}
      key={`${copy}-${getReviewKey(review, index)}`}
      role="group"
    >
      {renderReview ? renderReview(review, index, { clone: copy !== "original" }) : review}
    </li>
  ));

  return (
    <section aria-label={ariaLabel} aria-roledescription="карусель" className={["home-reviews-carousel", className].filter(Boolean).join(" ")}>
      <div
        className="home-reviews-carousel__viewport"
        data-active-index={activePageIndex}
        data-loop={renderLoop}
        id={viewportId}
        onKeyDown={onKeyDown}
        onScroll={() => { updatePosition(); settle(); }}
        onPointerDown={() => { pendingScrollTarget.current = null; }}
        onWheel={() => { pendingScrollTarget.current = null; }}
        onTouchStart={() => { pendingScrollTarget.current = null; touching.current = true; clearTimeout(settleTimer.current); }}
        onTouchEnd={() => { touching.current = false; settle(); }}
        onTouchCancel={() => { touching.current = false; settle(); }}
        ref={viewportRef}
        tabIndex={0}
      >
        <ul className="home-reviews-carousel__track">
          {renderLoop && renderItems("before")}
          {renderItems("original")}
          {renderLoop && renderItems("after")}
        </ul>
      </div>
      {showControls && (
        <div className="home-reviews-carousel__controls">
          <HomeButton aria-controls={viewportId} aria-label={previousLabel} className="home-reviews-carousel__previous" disabled={!scrollable || (!renderLoop && activePageIndex === 0)} onClick={() => scrollToPage(activeIndexRef.current - 1)} size="icon" variant="carousel">
            {previousIcon ? <img src={previousIcon} alt="" aria-hidden="true" /> : <span aria-hidden="true">←</span>}
          </HomeButton>
          <HomeButton aria-controls={viewportId} aria-label={nextLabel} className="home-reviews-carousel__next" disabled={!scrollable || (!renderLoop && activePageIndex === pages.length - 1)} onClick={() => scrollToPage(activeIndexRef.current + 1)} size="icon" variant="carousel">
            {nextIcon ? <img src={nextIcon} alt="" aria-hidden="true" /> : <span aria-hidden="true">→</span>}
          </HomeButton>
        </div>
      )}
      {showDots && pages.length > 1 && (
        <div aria-label="Навигация по отзывам" className="home-reviews-carousel__dots">
          {pages.map((page, index) => (
            <button aria-label={`Перейти к странице ${index + 1}`} aria-pressed={index === activePageIndex} className={`home-reviews-carousel__dot${index === activePageIndex ? " home-reviews-carousel__dot--active" : ""}`} key={page.itemIndex} onClick={() => scrollToPage(index)} type="button" />
          ))}
        </div>
      )}
    </section>
  );
});
ReviewsCarousel.displayName = "ReviewsCarousel";
export default ReviewsCarousel;
