import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import OrderModal from "../order/shared/OrderModal";
import { MEDIA_QUERIES } from "../../config/breakpoints";
import { useProductionNotice } from "./ProductionNoticeContext";
import ProductionNoticeCard from "./ProductionNoticeCard";
import { acknowledgeNotice, isCurrentNotice, isNoticePage, readAcknowledgement } from "./noticeState";
import desktopClose from "../../images/deadline-close-desktop.svg";
import mobileClose from "../../images/deadline-close-mobile.svg";

export default function ProductionNoticePopup() {
  const { pathname } = useLocation();
  const { notice } = useProductionNotice();
  const [seen, setSeen] = useState(() => readAcknowledgement(() => window.sessionStorage));
  const [otherDialog, setOtherDialog] = useState(false);
  const [checkedDialogs, setCheckedDialogs] = useState(false);
  const eligible = isNoticePage(pathname) && isCurrentNotice(notice) && seen !== notice.version;

  useEffect(() => {
    if (!eligible) return undefined;
    const check = () => {
      setOtherDialog([...document.querySelectorAll('[role="dialog"], [aria-modal="true"]')]
        .some((node) => !node.classList.contains("productionNotice") && !node.closest('[aria-hidden="true"]') && node.getClientRects().length));
      setCheckedDialogs(true);
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "aria-hidden", "open"] });
    return () => observer.disconnect();
  }, [eligible]);

  const close = () => {
    acknowledgeNotice(() => window.sessionStorage, notice.version);
    setSeen(notice.version);
  };
  if (!eligible || otherDialog || !checkedDialogs) return null;
  return <OrderModal className="productionNotice" overlayClassName="productionNoticeOverlay" inertBackground
    label="Актуальные сроки изготовления" closeLabel="Закрыть уведомление о сроках" onClose={close}
    closeIcon={<picture><source media={MEDIA_QUERIES.tabletMax} srcSet={mobileClose} /><img src={desktopClose} alt="" /></picture>}>
    <ProductionNoticeCard text={notice.text} additionalText={notice.additionalText} onConfirm={close} />
  </OrderModal>;
}
