import { useProductionNotice } from "./ProductionNoticeContext";
import { isCurrentNotice } from "./noticeState";

export default function ProductionNoticeInline() {
  const { notice } = useProductionNotice();
  if (!isCurrentNotice(notice)) return null;
  return <aside className="productionNoticeInline" aria-label="Сроки изготовления" aria-live="polite">
    <p>{notice.text}</p>{notice.additionalText && <p>{notice.additionalText}</p>}
  </aside>;
}
