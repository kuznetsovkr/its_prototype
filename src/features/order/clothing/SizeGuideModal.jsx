import { createPortal } from "react-dom";

import { SIZE_CHARTS, SIZE_COLUMNS } from "./clothingCatalog";

const SizeGuideModal = ({ chartKey, onChartChange, onClose }) => {
  const chart = SIZE_CHARTS[chartKey] || SIZE_CHARTS.default;
  const hasSizeGuide = chart.rows.length > 0;

  return createPortal(
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modalClose" aria-label="Закрыть таблицу размеров" onClick={onClose}>
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
            <path d="M16.5 0.5L0.5 16.5M16.5 16.5L0.5 0.5" stroke="#433F3C" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="modalHeader">
          {[["tshirt", "футболка"], ["hoodie", "худи"], ["svitshot", "свитшот"]].map(([key, label]) => (
            <button
              type="button"
              key={key}
              className={chartKey === key ? "active" : ""}
              aria-pressed={chartKey === key}
              onClick={() => onChartChange(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={`sizeTable sizeTableGrid${hasSizeGuide ? "" : " sizeTableGrid--empty"}`}>
          {hasSizeGuide ? (
            <>
              <div className="sizeTable__table">
                <table>
                  <thead><tr>{SIZE_COLUMNS.map((column) => <th key={column}>{column}</th>)}</tr></thead>
                  <tbody>
                    {chart.rows.map((row) => (
                      <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sizeTable__illustration">
                <div className="sizeTable__placeholder">
                  <img className="sizeTable__img" src={chart.image} alt={chart.title} />
                </div>
              </div>
            </>
          ) : (
            <div className="sizeTable__empty">
              Таблица размеров для этого изделия пока не добавлена.
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SizeGuideModal;
