import { useRef, useState } from "react";

const WorkComparisonCard = ({ item, breakpoint }) => {
  const pointerType = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [photoRequested, setPhotoRequested] = useState(false);
  const [photoReady, setPhotoReady] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const wantsPhoto = isHovered || isSelected;
  const showPhoto = wantsPhoto && photoReady;
  const supportsHover = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const requestPhoto = () => {
    setPhotoRequested(true);
    setPhotoFailed(false);
  };
  const reset = () => {
    setIsHovered(false);
    setIsSelected(false);
  };
  const failPhoto = () => {
    setPhotoReady(false);
    setPhotoFailed(true);
    reset();
  };
  const loadPhoto = async (event) => {
    try {
      await event.currentTarget.decode();
      setPhotoReady(true);
    } catch {
      failPhoto();
    }
  };

  return (
    <button
      type="button"
      className={`home-work-card${showPhoto ? " is-showing-original" : ""}`}
      aria-label={`${wantsPhoto ? "Показать вышивку" : "Показать исходное фото"}: ${item.label}`}
      aria-pressed={wantsPhoto}
      aria-busy={wantsPhoto && !photoReady && !photoFailed}
      aria-describedby="home-works-instructions"
      data-work-id={item.id}
      onPointerDown={(event) => { pointerType.current = event.pointerType; }}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse" && supportsHover()) {
          requestPhoto();
          setIsHovered(true);
        }
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setIsHovered(false);
      }}
      onClick={(event) => {
        // Mouse interaction is temporary hover. Touch, pen and native keyboard
        // activation toggle the comparison without intercepting scroll gestures.
        if (event.detail > 0 && pointerType.current === "mouse" && supportsHover()) return;
        requestPhoto();
        setIsHovered(false);
        setIsSelected(!wantsPhoto);
      }}
      onBlur={reset}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          reset();
        }
      }}
    >
      <img
        className="home-work-card__image home-work-card__image--work"
        src={item.work}
        style={breakpoint === "mobile" ? item.workMobileCrop || item.workCrop : item.workCrop}
        alt=""
        loading="lazy"
        decoding="async"
      />
      {photoRequested && !photoFailed && (
        <img
          className="home-work-card__image home-work-card__image--original"
          src={item.photo}
          style={item.photoCrop}
          alt=""
          decoding="async"
          onLoad={loadPhoto}
          onError={failPhoto}
        />
      )}
      <span className="home-visually-hidden" role="status">
        {photoFailed ? "Не удалось загрузить исходное фото. Попробуйте ещё раз." : ""}
      </span>
    </button>
  );
};

export default WorkComparisonCard;
