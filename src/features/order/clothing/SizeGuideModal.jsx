import OrderModal from "../shared/OrderModal";
import { SIZE_CHARTS, SIZE_COLUMNS } from "./clothingCatalog";

const SizeGuideModal = ({ chartKey, options = [], onChartChange, onClose, returnFocusTo }) => {
  const chart = SIZE_CHARTS[chartKey] || SIZE_CHARTS.default;
  const hasSizeGuide = chart.rows.length > 0;

  return (
    <OrderModal label="Таблица размеров" closeLabel="Закрыть таблицу размеров" onClose={onClose} returnFocusTo={returnFocusTo}>
        <div className="modalHeader">
          {options.map(({ key, label }) => (
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
    </OrderModal>
  );
};

export default SizeGuideModal;
