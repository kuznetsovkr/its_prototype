import { useState, useEffect, useMemo } from "react";
import WarehouseTable from "../components/WarehouseTable";
import ColorSelect from "../components/ColorSelect";
import api from '../api'
const defaultColors = [
  { name: "Черный", code: "#000000" },
  { name: "Белый",  code: "#FFFFFF" },
  { name: "Серый",  code: "#808080" },
  { name: "Красный",code: "#FF0000" },
  { name: "Синий",  code: "#0057FF" },
];
const popularSizes = ["XS", "S", "M", "L", "XL", "XXL"];
const ALL_VALUE = "Все";
const AdminInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [colorOptions, setColorOptions] = useState(defaultColors);
  const [clothingTypes, setClothingTypes] = useState([]);
  const [newItem, setNewItem] = useState({
    clothingTypeId: "",
    productType: "",
    color: "",
    colorCode: "",
    size: "",
    quantity: 0,
    imageUrl: "",
  });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filters, setFilters] = useState({ type: ALL_VALUE, color: ALL_VALUE, size: ALL_VALUE });
  const [sort, setSort] = useState({ key: "quantity", dir: "desc" });
  useEffect(() => {
    fetchInventory();
    fetchColors();
    fetchClothingTypes();
  }, []);
  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory');
      setInventory(res.data || []);
    } catch (err) {
      console.error("Ошибка загрузки склада:", err);
    }
  };
  const fetchClothingTypes = async () => {
    try {
      const res = await api.get('/clothing-types');
      if (Array.isArray(res.data)) {
        setClothingTypes(res.data);
      }
    } catch (err) {
      console.error("ошибка новая", err);
    }
  };
  const fetchColors = async () => {
    try {
      const res = await api.get('/colors');
      if (Array.isArray(res.data) && res.data.length) {
        setColorOptions(res.data);
      }
    } catch {
    }
  };
  const addColor = async ({ name, code }) => {
    try {
      const res = await api.post('/colors', { name, code });
      const saved = res.data?.name ? res.data : { name, code };
      setColorOptions((prev) => {
        const exists = prev.some((c) => c.name.toLowerCase() === saved.name.toLowerCase());
        return exists ? prev : [...prev, saved];
      });
      return saved;
    } catch {
      const saved = { name, code };
      setColorOptions((prev) => {
        const exists = prev.some((c) => c.name.toLowerCase() === saved.name.toLowerCase());
        return exists ? prev : [...prev, saved];
      });
      return saved;
    }
  };
  const updateItem = async (updated) => {
    try {
      const payload = {
        productType: updated.productType,
        clothingTypeId: updated.clothingTypeId ? Number(updated.clothingTypeId) : undefined,
        color: updated.color,
        colorCode: updated.colorCode,
        size: updated.size,
        quantity: Number(updated.quantity),
        imageUrl: updated.imageUrl,
      };
      await api.put(`/inventory/${updated.id}`, payload);
      await fetchInventory();
    } catch (err) {
      console.error("Failed to update inventory:", err);
    }
  };
  const deleteItem = async (id) => {
    try {
      await api.delete(`/inventory/${id}`);
      fetchInventory();
    } catch (err) {
      console.error("Ошибка удаления:", err);
    }
  };
  const addItem = async () => {
    if (!newItem.clothingTypeId || !newItem.productType || !newItem.color || !newItem.colorCode || !newItem.size || Number(newItem.quantity) <= 0) {
      return;
    }
    try {
      await api.post('/inventory', {
        ...newItem,
        clothingTypeId: Number(newItem.clothingTypeId),
        quantity: Number(newItem.quantity),
      });
      setNewItem({ clothingTypeId: "", productType: "", color: "", colorCode: "", size: "", quantity: 0, imageUrl: "" });
      fetchInventory();
    } catch (err) {
      console.error("Ошибка добавления:", err);
    }
  };
  const typeLabel = (item) => item?.clothingTypeName || item?.productType || "";
  const typeOptions = useMemo(
    () =>
      Array.from(new Set(inventory.map((i) => typeLabel(i)).filter(Boolean))).sort((a, b) =>
        String(a).localeCompare(String(b), "ru")
      ),
    [inventory]
  );
  const unique = (key) =>
    Array.from(new Set(inventory.map((i) => i[key]).filter(Boolean))).sort((a, b) =>
      String(a).localeCompare(String(b), "ru")
    );
  const filtered = useMemo(() => {
    return inventory.filter((i) => {
      const typeName = typeLabel(i);
      const byType = filters.type === ALL_VALUE || typeName === filters.type;
      const byColor = filters.color === ALL_VALUE || i.color === filters.color;
      const bySize  = filters.size  === ALL_VALUE || i.size  === filters.size;
      return byType && byColor && bySize;
    });
  }, [inventory, filters]);
  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sort.key === "quantity") {
      arr.sort((a, b) =>
        sort.dir === "asc" ? Number(a.quantity) - Number(b.quantity) : Number(b.quantity) - Number(a.quantity)
      );
    }
    return arr;
  }, [filtered, sort]);
  const toggleSortQuantity = () =>
    setSort((s) => ({ key: "quantity", dir: s.dir === "asc" ? "desc" : "asc" }));
  const resetFilters = () => setFilters({ type: ALL_VALUE, color: ALL_VALUE, size: ALL_VALUE });
  const codeByName = (name) =>
    colorOptions.find(c => c.name.toLowerCase() === String(name || "").toLowerCase())?.code || "";
  return (
    <section className="admin-wrap">
      <div className="admin-header">
        <h1 className="heading admin-title">Управление складом</h1>
        <button
          type="button"
          className="btn btn-outline btn-icon"
          aria-expanded={isAddOpen}
          aria-controls="addForm"
          onClick={() => setIsAddOpen((v) => !v)}
        >
          {isAddOpen ? "−" : "+"}
        </button>
      </div>
      <div id="addForm" className={`collapsible ${isAddOpen ? "is-open" : ""}`}>
        <div className="card form-card">
          <div className="form-grid">
            <div className="field">
              <label className="label">Тип одежды</label>
              <select
                className="select"
                value={newItem.clothingTypeId}
                onChange={(e) => {
                  const selected = clothingTypes.find((t) => String(t.id) === e.target.value);
                  setNewItem((prev) => ({
                    ...prev,
                    clothingTypeId: e.target.value,
                    productType: selected?.name || "",
                  }));
                }}>
                          <option value="">Выберите тип</option>
                {clothingTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label">Цвет</label>
              <ColorSelect
                colors={colorOptions}
                valueName={newItem.color}
                valueCode={newItem.colorCode}
                onChange={(c) => setNewItem({ ...newItem, color: c.name, colorCode: c.code })}
                onAddColor={addColor}
              />
            </div>
            <div className="field">
              <label className="label">Размер</label>
              <input
                className="input"
                list="sizes"
                type="text"
                placeholder="Выберите или введите свой размер"
                value={newItem.size}
                onChange={(e) => setNewItem({ ...newItem, size: e.target.value })}
              />
              <datalist id="sizes">
                {popularSizes.map((s) => (<option key={s} value={s} />))}
              </datalist>
            </div>
            <div className="field">
              <label className="label">Количество</label>
              <input
                className="input"
                type="number"
                min={0}
                placeholder="Количество"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value.replace(/[^\d]/g, "") })}
              />
            </div>
            <div className="field">
              <label className="label">Изображение</label>
              <div className="file-row">
                <input id="fileUpload" type="file" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append("image", file);
                  try {
                    const res = await api.post('/upload', formData, {
                      headers: { "Content-Type": "multipart/form-data" },
                    });
                    setNewItem((prev) => ({ ...prev, imageUrl: res.data.imageUrl }));
                  } catch (err) {
                    console.error("Ошибка загрузки изображения:", err);
                  }
                }} hidden />
                <label htmlFor="fileUpload" className="btn btn-outline">Выберите файл</label>
                {newItem.imageUrl && <span className="file-name">Загружено</span>}
              </div>
            </div>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={addItem}>Добавить</button>
          </div>
        </div>
      </div>
      <div className="card filters-card">
        <div className="filters-grid">
          <div className="field">
            <label className="label">Тип</label>
            <select className="select" value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
              {[ALL_VALUE, ...typeOptions].map((t) => (<option key={t} value={t}>{t}</option>))}
            </select>
          </div>
          <div className="field">
            <label className="label">Цвет</label>
            <select className="select" value={filters.color} onChange={(e) => setFilters((f) => ({ ...f, color: e.target.value }))}>
              {[ALL_VALUE, ...unique("color")].map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
          <div className="field">
            <label className="label">Размер</label>
            <select className="select" value={filters.size} onChange={(e) => setFilters((f) => ({ ...f, size: e.target.value }))}>
              {[ALL_VALUE, ...unique("size")].map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
          <div className="filters-actions">
            <button className="btn btn-outline" onClick={resetFilters}>Сбросить фильтры</button>
          </div>
        </div>
      </div>
      <WarehouseTable
        inventory={sorted}
        deleteItem={deleteItem}
        sortDir={sort.dir}
        onToggleSortQuantity={toggleSortQuantity}
        updateItem={updateItem}
        colorOptions={colorOptions}
        codeByName={codeByName}
        onAddColor={addColor}
        clothingTypes={clothingTypes}
      />
    </section>
  );
};
export default AdminInventory;
