import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CatalogManager from "./CatalogManager";
import PricingManager from "./PricingManager";
import WarehouseTable from "../components/WarehouseTable";
import ColorSelect from "../components/ColorSelect";
import api from "../api";
import { clearAuth } from "../utils/auth";

const popularSizes = ["XS", "S", "M", "L", "XL", "XXL"];
const ALL_VALUE = "Все";
const createEmptyItem = () => ({
  clothingTypeId: "",
  productType: "",
  color: "",
  colorCode: "",
  size: "",
  quantity: "",
  imageUrl: "",
});

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;

const AdminInventory = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [clothingTypes, setClothingTypes] = useState([]);
  const [pricingConfig, setPricingConfig] = useState(null);
  const [newItem, setNewItem] = useState(createEmptyItem);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [notice, setNotice] = useState(null);
  const [filters, setFilters] = useState({ type: ALL_VALUE, color: ALL_VALUE, size: ALL_VALUE });
  const [sort, setSort] = useState({ key: "quantity", dir: "desc" });

  const showNotice = useCallback((type, message) => {
    setNotice({ type, message });
  }, []);

  const fetchInventory = useCallback(async () => {
    const response = await api.get("/inventory");
    setInventory(Array.isArray(response.data) ? response.data : []);
  }, []);

  const fetchClothingTypes = useCallback(async () => {
    const response = await api.get("/clothing-types");
    setClothingTypes(Array.isArray(response.data) ? response.data : []);
  }, []);

  const fetchColors = useCallback(async () => {
    const response = await api.get("/colors");
    setColorOptions(Array.isArray(response.data) ? response.data : []);
  }, []);

  const fetchPricingConfig = useCallback(async () => {
    const response = await api.get("/pricing/config");
    setPricingConfig(response.data || null);
  }, []);

  const loadAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchInventory(),
        fetchClothingTypes(),
        fetchColors(),
        fetchPricingConfig(),
      ]);
    } catch (error) {
      showNotice("error", getErrorMessage(error, "Не удалось загрузить данные админки."));
    } finally {
      setIsLoading(false);
    }
  }, [fetchColors, fetchClothingTypes, fetchInventory, fetchPricingConfig, showNotice]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const addClothingType = async ({ name }) => {
    try {
      await api.post("/clothing-types", { name });
      await fetchClothingTypes();
      showNotice("success", `Тип «${name}» добавлен.`);
    } catch (error) {
      showNotice("error", getErrorMessage(error, "Не удалось добавить тип одежды."));
      throw error;
    }
  };

  const savePricingConfig = async (nextConfig) => {
    setIsSavingPricing(true);
    try {
      const response = await api.put("/pricing/config", nextConfig);
      setPricingConfig(response.data);
      await Promise.all([fetchInventory(), fetchClothingTypes()]);
      showNotice("success", "Цены сохранены и уже применяются к новым заказам.");
    } catch (error) {
      showNotice("error", getErrorMessage(error, "Не удалось сохранить настройки цен."));
    } finally {
      setIsSavingPricing(false);
    }
  };

  const deleteClothingType = async (type) => {
    if (!window.confirm(`Удалить тип «${type.name}»?`)) return;

    try {
      await api.delete(`/clothing-types/${type.id}`);
      await fetchClothingTypes();
      showNotice("success", `Тип «${type.name}» удалён.`);
    } catch (error) {
      showNotice("error", getErrorMessage(error, "Не удалось удалить тип одежды."));
    }
  };

  const addColor = async ({ name, code }) => {
    try {
      const response = await api.post("/colors", { name, code });
      const saved = response.data?.name ? response.data : { name, code };
      setColorOptions((current) => {
        const index = current.findIndex(
          (color) => color.name.toLowerCase() === saved.name.toLowerCase()
        );
        if (index < 0) return [...current, saved];
        return current.map((color, itemIndex) => itemIndex === index ? saved : color);
      });
      showNotice("success", `Цвет «${saved.name}» сохранён.`);
      return saved;
    } catch (error) {
      showNotice("error", getErrorMessage(error, "Не удалось сохранить цвет."));
      throw error;
    }
  };

  const updateItem = async (updated) => {
    try {
      await api.put(`/inventory/${updated.id}`, {
        productType: updated.productType,
        clothingTypeId: updated.clothingTypeId ? Number(updated.clothingTypeId) : undefined,
        color: updated.color,
        colorCode: updated.colorCode,
        size: updated.size,
        quantity: Number(updated.quantity),
        imageUrl: updated.imageUrl,
      });
      await fetchInventory();
      showNotice("success", "Складская позиция обновлена.");
      return true;
    } catch (error) {
      showNotice("error", getErrorMessage(error, "Не удалось обновить позицию."));
      return false;
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Удалить складскую позицию?")) return;

    try {
      await api.delete(`/inventory/${id}`);
      await fetchInventory();
      showNotice("success", "Складская позиция удалена.");
    } catch (error) {
      showNotice("error", getErrorMessage(error, "Не удалось удалить позицию."));
    }
  };

  const handleNewItemUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNewItem((current) => ({ ...current, imageUrl: response.data.imageUrl }));
      showNotice("success", "Изображение загружено.");
    } catch (error) {
      showNotice("error", getErrorMessage(error, "Не удалось загрузить изображение."));
    } finally {
      setIsUploading(false);
    }
  };

  const canAddItem = Boolean(
    newItem.clothingTypeId &&
    newItem.productType &&
    newItem.color &&
    newItem.colorCode &&
    newItem.size.trim() &&
    Number(newItem.quantity) > 0
  );

  const addItem = async (event) => {
    event.preventDefault();
    if (!canAddItem) {
      showNotice("error", "Заполните тип, цвет, размер и количество.");
      return;
    }

    setIsSavingItem(true);
    try {
      await api.post("/inventory", {
        ...newItem,
        clothingTypeId: Number(newItem.clothingTypeId),
        quantity: Number(newItem.quantity),
      });
      setNewItem(createEmptyItem());
      setIsAddOpen(false);
      await fetchInventory();
      showNotice("success", "Складская позиция добавлена.");
    } catch (error) {
      showNotice("error", getErrorMessage(error, "Не удалось добавить позицию."));
    } finally {
      setIsSavingItem(false);
    }
  };

  const typeLabel = (item) => item?.clothingTypeName || item?.productType || "";
  const typeOptions = useMemo(
    () => Array.from(new Set(inventory.map(typeLabel).filter(Boolean))).sort((a, b) =>
      String(a).localeCompare(String(b), "ru")
    ),
    [inventory]
  );
  const unique = (key) => Array.from(new Set(inventory.map((item) => item[key]).filter(Boolean)))
    .sort((a, b) => String(a).localeCompare(String(b), "ru"));

  const filtered = useMemo(() => inventory.filter((item) => {
    const byType = filters.type === ALL_VALUE || typeLabel(item) === filters.type;
    const byColor = filters.color === ALL_VALUE || item.color === filters.color;
    const bySize = filters.size === ALL_VALUE || item.size === filters.size;
    return byType && byColor && bySize;
  }), [filters, inventory]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    if (sort.key === "quantity") {
      rows.sort((a, b) => sort.dir === "asc"
        ? Number(a.quantity) - Number(b.quantity)
        : Number(b.quantity) - Number(a.quantity));
    }
    return rows;
  }, [filtered, sort]);

  const stats = useMemo(() => ({
    positions: inventory.length,
    units: inventory.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    lowStock: inventory.filter((item) => Number(item.quantity || 0) <= 5).length,
  }), [inventory]);

  const usedTypeIds = useMemo(
    () => new Set(inventory.map((item) => String(item.clothingTypeId)).filter(Boolean)),
    [inventory]
  );

  const codeByName = (name) => colorOptions.find(
    (color) => color.name.toLowerCase() === String(name || "").toLowerCase()
  )?.code || "";

  const toggleSortQuantity = () => setSort((current) => ({
    key: "quantity",
    dir: current.dir === "asc" ? "desc" : "asc",
  }));
  const resetFilters = () => setFilters({ type: ALL_VALUE, color: ALL_VALUE, size: ALL_VALUE });
  const handleLogout = () => {
    clearAuth();
    navigate("/admin", { replace: true });
  };

  return (
    <section className="admin-page">
      <header className="admin-dashboard-header">
        <div className="admin-dashboard-header__copy">
          <p className="admin-dashboard-header__eyebrow">панель управления</p>
          <h1>склад и каталог</h1>
          <p>Добавляйте ассортимент, следите за остатками и обновляйте позиции.</p>
        </div>

        <div className="admin-dashboard-header__side">
          <dl className="admin-stats">
            <div><dt>Позиций</dt><dd>{stats.positions}</dd></div>
            <div><dt>Единиц</dt><dd>{stats.units}</dd></div>
            <div><dt>Заканчиваются</dt><dd>{stats.lowStock}</dd></div>
          </dl>
          <div className="admin-dashboard-header__actions">
            <button className="btn btn-light" type="button" onClick={loadAdminData} disabled={isLoading}>
              {isLoading ? "Обновляем…" : "Обновить данные"}
            </button>
            <button className="btn btn-ghost" type="button" onClick={handleLogout}>Выйти</button>
          </div>
        </div>
      </header>

      {notice && (
        <div className={`admin-notice admin-notice--${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>
          <span>{notice.message}</span>
          <button type="button" aria-label="Закрыть сообщение" onClick={() => setNotice(null)}>×</button>
        </div>
      )}

      <CatalogManager
        clothingTypes={clothingTypes}
        colors={colorOptions}
        usedTypeIds={usedTypeIds}
        onAddClothingType={addClothingType}
        onDeleteClothingType={deleteClothingType}
        onAddColor={addColor}
      />

      <PricingManager
        config={pricingConfig}
        isSaving={isSavingPricing}
        onSave={savePricingConfig}
      />

      <section className="admin-panel admin-inventory" aria-labelledby="admin-inventory-title">
        <div className="admin-panel__heading admin-inventory__heading">
          <div>
            <p className="admin-panel__eyebrow">03 · наполнение склада</p>
            <h2 id="admin-inventory-title">Складские позиции</h2>
          </div>
          <button
            className="btn btn-primary admin-inventory__add-toggle"
            type="button"
            aria-expanded={isAddOpen}
            aria-controls="admin-add-item"
            onClick={() => setIsAddOpen((open) => !open)}
          >
            <span aria-hidden="true">{isAddOpen ? "−" : "+"}</span>
            {isAddOpen ? "Закрыть форму" : "Добавить позицию"}
          </button>
        </div>

        <div id="admin-add-item" className={`collapsible ${isAddOpen ? "is-open" : ""}`}>
          <form className="form-card" onSubmit={addItem}>
            <div className="form-card__heading">
              <h3>Новая позиция</h3>
              <p>Фото можно добавить сразу или загрузить позже при редактировании.</p>
            </div>
            <div className="form-grid">
              <label className="field">
                <span className="label">Тип одежды</span>
                <select
                  className="select"
                  value={newItem.clothingTypeId}
                  onChange={(event) => {
                    const selected = clothingTypes.find((type) => String(type.id) === event.target.value);
                    setNewItem((current) => ({
                      ...current,
                      clothingTypeId: event.target.value,
                      productType: selected?.name || "",
                    }));
                  }}
                >
                  <option value="">Выберите тип</option>
                  {clothingTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                </select>
              </label>

              <div className="field">
                <span className="label">Цвет</span>
                <ColorSelect
                  colors={colorOptions}
                  valueName={newItem.color}
                  valueCode={newItem.colorCode}
                  onChange={(color) => setNewItem((current) => ({
                    ...current,
                    color: color.name,
                    colorCode: color.code,
                  }))}
                  onAddColor={addColor}
                />
              </div>

              <label className="field">
                <span className="label">Размер</span>
                <input
                  className="input"
                  list="admin-sizes"
                  type="text"
                  placeholder="Например, M"
                  value={newItem.size}
                  onChange={(event) => setNewItem((current) => ({ ...current, size: event.target.value }))}
                />
                <datalist id="admin-sizes">
                  {popularSizes.map((size) => <option key={size} value={size} />)}
                </datalist>
              </label>

              <label className="field">
                <span className="label">Количество</span>
                <input
                  className="input"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="0"
                  value={newItem.quantity}
                  onChange={(event) => setNewItem((current) => ({
                    ...current,
                    quantity: event.target.value.replace(/\D/g, ""),
                  }))}
                />
              </label>

              <div className="field form-card__upload">
                <span className="label">Изображение</span>
                <div className="file-row">
                  <input
                    id="admin-file-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleNewItemUpload}
                    hidden
                  />
                  <label className="btn btn-outline" htmlFor="admin-file-upload">
                    {isUploading ? "Загружаем…" : "Выбрать файл"}
                  </label>
                  <span className="file-name">{newItem.imageUrl ? "Файл загружен" : "PNG, JPG или WebP"}</span>
                </div>
              </div>
            </div>
            <div className="actions">
              <button className="btn btn-primary" type="submit" disabled={!canAddItem || isSavingItem || isUploading}>
                {isSavingItem ? "Добавляем…" : "Добавить на склад"}
              </button>
            </div>
          </form>
        </div>

        <div className="filters-card">
          <div className="filters-card__heading">
            <h3>Фильтры</h3>
            <span>{sorted.length} из {inventory.length}</span>
          </div>
          <div className="filters-grid">
            <label className="field">
              <span className="label">Тип</span>
              <select className="select" value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}>
                {[ALL_VALUE, ...typeOptions].map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <label className="field">
              <span className="label">Цвет</span>
              <select className="select" value={filters.color} onChange={(event) => setFilters((current) => ({ ...current, color: event.target.value }))}>
                {[ALL_VALUE, ...unique("color")].map((color) => <option key={color} value={color}>{color}</option>)}
              </select>
            </label>
            <label className="field">
              <span className="label">Размер</span>
              <select className="select" value={filters.size} onChange={(event) => setFilters((current) => ({ ...current, size: event.target.value }))}>
                {[ALL_VALUE, ...unique("size")].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
            <button className="btn btn-outline filters-card__reset" type="button" onClick={resetFilters}>
              Сбросить фильтры
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="admin-loading" role="status">Загружаем склад…</div>
        ) : (
          <WarehouseTable
            inventory={sorted}
            emptyMessage={inventory.length ? "Ничего не найдено по текущим фильтрам." : "Склад пока пуст. Добавьте первую позицию."}
            deleteItem={deleteItem}
            sortDir={sort.dir}
            onToggleSortQuantity={toggleSortQuantity}
            updateItem={updateItem}
            colorOptions={colorOptions}
            codeByName={codeByName}
            onAddColor={addColor}
            clothingTypes={clothingTypes}
          />
        )}
      </section>
    </section>
  );
};

export default AdminInventory;
