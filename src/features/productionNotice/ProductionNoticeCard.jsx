import { MEDIA_QUERIES } from "../../config/breakpoints";
import desktopDog from "../../images/deadline-dog-desktop.webp";
import mobileDog from "../../images/deadline-dog-mobile.webp";

export default function ProductionNoticeCard({ text, additionalText, onConfirm, preview = false }) {
  return <div className={`productionNoticeCard${additionalText ? " productionNoticeCard--expanded" : ""}${preview ? " productionNoticeCard--preview" : ""}`}>
    <div className="productionNoticeCard__photo">
      <picture>
        <source media={MEDIA_QUERIES.tabletMax} srcSet={mobileDog} />
        <img src={desktopDog} alt="" width="880" height="808" />
      </picture>
      <h2 className="productionNoticeCard__title">важно</h2>
    </div>
    <div className="productionNoticeCard__body">
      <div className="productionNoticeCard__paper">
        <div className="productionNoticeCard__text"><p>{text}</p>{additionalText && <p>{additionalText}</p>}</div>
        <button type="button" className="productionNoticeCard__confirm" onClick={onConfirm} disabled={preview}>хорошо</button>
      </div>
    </div>
  </div>;
}
