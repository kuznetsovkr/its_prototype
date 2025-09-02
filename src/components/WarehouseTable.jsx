import { useState } from "react";
import ColorSelect from "./ColorSelect";
import api from '../api'
import { buildImgSrc } from '../utils/url';

const popularTypes = ["Худи", "Футболка", "Кофта", "Свитшот", "Майка"];
const popularSizes  = ["XS", "S", "M", "L", "XL", "XXL"];

const WarehouseTable = ({
  inventory,
  deleteItem,
  sortDir,
  onToggleSortQuantity,
  updateItem,
  colorOptions,
  codeByName,
  onAddColor,
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData]   = useState(null);

  const arrow = sortDir === "asc" ? "▲" : "▼";

  const startEditing = (row) => {
    setEditingId(row.id);
    setEditData({
      ...row,
      colorCode: row.colorCode || codeByName(row.color) || "",
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await api.post('/upload', formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setEditData((prev) => ({ ...prev, imageUrl: res.data.imageUrl }));
    } catch (err) {
      console.error("Ошибка загрузки изображения:", err);
    }
  };

  const saveRow = async () => {
    if (!editData) return;
    await updateItem({
      ...editData,
      quantity: Number(editData.quantity) || 0,
    });
    setEditingId(null);
    setEditData(null);
  };

  return (
    <div className="card table-card">
      <div className="table-wrap">
        <table className="orders-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Фото</th>
              <th>Тип</th>
              <th>Цвет</th>
              <th>Размер</th>
              <th className="th-sort" onClick={onToggleSortQuantity} role="button" tabIndex={0}>
                Количество <span className="sort-arrow">{arrow}</span>
              </th>
              <th>Действия</th>
            </tr>
          </thead>

          <tbody>
            {inventory.length === 0 ? (
              <tr>
                <td colSpan={7} className="muted">Ничего не найдено по текущим фильтрам</td>
              </tr>
            ) : (
              inventory.map((row) => {
                const isEditing = editingId === row.id;
                const imgUrl = buildImgSrc(isEditing ? (editData?.imageUrl || row.imageUrl) : row.imageUrl) || "";

                const colorChipCode = isEditing
                  ? (editData?.colorCode || "")
                  : (row.colorCode || codeByName(row.color) || "");

                return (
                  <tr key={row.id}>
                    <td>{row.id}</td>

                    <td>
                      {imgUrl ? (
                        <img className="thumb" src={imgUrl} alt="Превью" width="56" height="56" />
                      ) : (
                        <span className="muted">Нет фото</span>
                      )}
                      {isEditing && (
                        <div className="file-mini" style={{ marginTop: 6 }}>
                          <input id={`file-${row.id}`} type="file" onChange={handleFileUpload} hidden />
                          <label htmlFor={`file-${row.id}`} className="btn btn-outline">Выберите файл</label>
                        </div>
                      )}
                    </td>

                    {/* Тип */}
                    <td>
                      {isEditing ? (
                        <>
                          <input
                            className="input"
                            list={`types-${row.id}`}
                            type="text"
                            value={editData?.productType ?? ""}
                            onChange={(e) => handleChange("productType", e.target.value)}
                          />
                          <datalist id={`types-${row.id}`}>
                            {popularTypes.map((t) => (<option key={t} value={t} />))}
                          </datalist>
                        </>
                      ) : (
                        row.productType
                      )}
                    </td>

                    {/* Цвет */}
                    <td>
                      {isEditing ? (
                        <ColorSelect
                          colors={colorOptions}
                          valueName={editData?.color ?? ""}
                          valueCode={editData?.colorCode ?? ""}
                          onChange={(c) => {
                            handleChange("color", c.name);
                            handleChange("colorCode", c.code);
                          }}
                          onAddColor={onAddColor}
                        />
                      ) : (
                        <span className="color-chip">
                          <span className="swatch" style={{ backgroundColor: colorChipCode }} />
                          {row.color}
                        </span>
                      )}
                    </td>

                    {/* Размер */}
                    <td>
                      {isEditing ? (
                        <>
                          <input
                            className="input"
                            list={`sizes-${row.id}`}
                            type="text"
                            value={editData?.size ?? ""}
                            onChange={(e) => handleChange("size", e.target.value)}
                          />
                          <datalist id={`sizes-${row.id}`}>
                            {popularSizes.map((s) => (<option key={s} value={s} />))}
                          </datalist>
                        </>
                      ) : (
                        row.size
                      )}
                    </td>

                    {/* Количество (read-only вне редактирования) */}
                    <td className="qty-cell">
                      {isEditing ? (
                        <input
                          className="input input-qty"
                          type="number"
                          min={0}
                          value={editData?.quantity ?? 0}
                          onChange={(e) => handleChange("quantity", e.target.value.replace(/[^\d]/g, ""))}
                        />
                      ) : (
                        row.quantity
                      )}
                    </td>

                    <td className="actions-cell">
                      {isEditing ? (
                        <>
                          <button className="btn btn-outline" onClick={saveRow}>Сохранить</button>
                          <button className="btn btn-outline" onClick={cancelEditing}>Отмена</button>
                          <button className="btn btn-danger"  onClick={() => deleteItem(row.id)}>Удалить</button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-outline" onClick={() => startEditing(row)}>Редактировать</button>
                          <button className="btn btn-danger"  onClick={() => deleteItem(row.id)}>Удалить</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WarehouseTable;
