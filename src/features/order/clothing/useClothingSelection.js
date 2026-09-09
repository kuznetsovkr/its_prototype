import { useEffect, useMemo, useState } from "react";
import { useOrder } from "../../../context/OrderContext";
import { buildImgSrc } from "../../../utils/url";
import figmaTshirtImg from "../../../images/order/tshirt-black.webp";
import { loadClothingCatalog } from "./clothingApi";
import {
  COLOR_ORDER,
  CORE_SIZES,
  TYPE_ORDER,
  detectChartKey,
  hasStock,
  normalizeKey,
  uniqBy,
} from "./clothingCatalog";

export const useClothingSelection = () => {
  const { order, setClothing } = useOrder();
  const { clothing } = order;
  const [inventory, setInventory] = useState([]);
  const [clothingTypes, setClothingTypes] = useState([]);
  const [colorCatalog, setColorCatalog] = useState([]);
  const [inventoryLoaded, setInventoryLoaded] = useState(false);
  const [selectedClothing, setSelectedClothing] = useState(clothing.type || "");
  const [selectedColor, setSelectedColor] = useState(clothing.color || "");
  const [selectedSize, setSelectedSize] = useState(clothing.size || "");

  const inStockInventory = useMemo(() => inventory.filter(hasStock), [inventory]);
  const sizeOptions = useMemo(() => {
    const supportsXXL = normalizeKey(selectedSize) === "xxl" ||
      inventory.some((item) => normalizeKey(item.size) === "xxl");
    return supportsXXL ? [...CORE_SIZES, "XXL"] : CORE_SIZES;
  }, [inventory, selectedSize]);

  const baseTypeOptions = useMemo(() => {
    const catalogTypes = clothingTypes.map((item) => String(item?.name || "").trim()).filter(Boolean);
    const inventoryTypes = inventory.map((item) => String(item?.productType || "").trim()).filter(Boolean);
    return uniqBy([...inventoryTypes, ...catalogTypes], normalizeKey)
      .sort((a, b) => TYPE_ORDER[detectChartKey(a)] - TYPE_ORDER[detectChartKey(b)])
      .map((label) => ({
        label,
        isAvailable: inStockInventory.some(
          (item) => normalizeKey(item.productType) === normalizeKey(label)
        ),
      }));
  }, [clothingTypes, inventory, inStockInventory]);

  const filteredByType = useMemo(
    () => inventory.filter(
      (item) => normalizeKey(item.productType) === normalizeKey(selectedClothing)
    ),
    [inventory, selectedClothing]
  );

  const colorOptions = useMemo(() => {
    const byName = new Map();
    const addColor = (label, code, preferLabel = false) => {
      const normalizedLabel = String(label || "").trim();
      if (!normalizedLabel) return;
      const key = normalizeKey(normalizedLabel);
      const current = byName.get(key);
      byName.set(key, {
        label: preferLabel ? normalizedLabel : current?.label || normalizedLabel,
        code: code || current?.code || "#CCCCCC",
      });
    };
    colorCatalog.forEach((color) => addColor(color?.name, color?.code));
    filteredByType.forEach((item) => addColor(item.color, item.colorCode, true));
    return Array.from(byName.values())
      .map((option) => ({
        ...option,
        isAvailable: filteredByType.some(
          (item) => hasStock(item) && normalizeKey(item.color) === normalizeKey(option.label)
        ),
      }))
      .sort((a, b) => (COLOR_ORDER.get(normalizeKey(a.label)) ?? 99) -
        (COLOR_ORDER.get(normalizeKey(b.label)) ?? 99));
  }, [colorCatalog, filteredByType]);

  const availableSizes = useMemo(() => filteredByType
    .filter((item) => hasStock(item) && normalizeKey(item.color) === normalizeKey(selectedColor))
    .reduce((sizes, item) => sizes.includes(item.size) ? sizes : [...sizes, item.size], []),
  [filteredByType, selectedColor]);

  const canProceed = Boolean(
    selectedClothing && selectedColor && selectedSize &&
    filteredByType.some((item) => hasStock(item) &&
      normalizeKey(item.color) === normalizeKey(selectedColor) && item.size === selectedSize)
  );

  useEffect(() => {
    let cancelled = false;
    loadClothingCatalog()
      .then((catalog) => {
        if (cancelled) return;
        setInventory(catalog.inventory);
        setClothingTypes(catalog.clothingTypes);
        setColorCatalog(catalog.colors);
        setInventoryLoaded(true);
      })
      .catch((error) => console.error("Error loading inventory:", error));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!inventoryLoaded) return;
    const firstAvailable = baseTypeOptions.find((option) => option.isAvailable)?.label || "";
    const currentAvailable = baseTypeOptions.some((option) =>
      normalizeKey(option.label) === normalizeKey(selectedClothing) && option.isAvailable);
    if (!currentAvailable && selectedClothing !== firstAvailable) {
      setSelectedClothing(firstAvailable);
      setSelectedColor("");
      setSelectedSize("");
    }
  }, [inventoryLoaded, baseTypeOptions, selectedClothing]);

  useEffect(() => {
    if (!inventoryLoaded) return;
    const availableColors = colorOptions.filter((option) => option.isAvailable);
    const hasSelected = availableColors.some((option) =>
      normalizeKey(option.label) === normalizeKey(selectedColor));
    if (availableColors.length && !hasSelected) {
      setSelectedColor(availableColors[0].label);
      setSelectedSize("");
    } else if (!availableColors.length) {
      if (selectedColor) setSelectedColor("");
      if (selectedSize) setSelectedSize("");
    }
  }, [inventoryLoaded, colorOptions, selectedColor, selectedSize]);

  useEffect(() => {
    if (inventoryLoaded && selectedSize && !availableSizes.includes(selectedSize)) setSelectedSize("");
  }, [inventoryLoaded, availableSizes, selectedSize]);

  useEffect(() => {
    const next = {
      type: selectedClothing,
      color: selectedColor,
      size: selectedSize,
    };
    const isSame =
      (clothing.type || "") === (next.type || "") &&
      (clothing.color || "") === (next.color || "") &&
      (clothing.size || "") === (next.size || "");
    if (isSame) return;
    setClothing(next);
  }, [selectedClothing, selectedColor, selectedSize, setClothing,
    clothing.type, clothing.color, clothing.size]);

  const previewItem = useMemo(() => {
    const exact = filteredByType.find((item) => hasStock(item) &&
      normalizeKey(item.color) === normalizeKey(selectedColor));
    if (exact) return exact;
    if (!selectedClothing) return null;
    return inventory.find(
      (item) => normalizeKey(item.productType) === normalizeKey(selectedClothing)
    ) || null;
  }, [filteredByType, selectedColor, selectedClothing, inventory]);
  const previewSrc = useMemo(() => buildImgSrc(previewItem?.imageUrl), [previewItem?.imageUrl]);
  const previewAlt = selectedClothing || "Одежда";
  const [stablePreview, setStablePreview] = useState({ src: "", alt: "" });

  useEffect(() => {
    if (!previewSrc) {
      if (stablePreview.src) setStablePreview({ src: "", alt: "" });
      return undefined;
    }
    if (previewSrc === stablePreview.src) {
      if (stablePreview.alt !== previewAlt) setStablePreview((current) => ({ ...current, alt: previewAlt }));
      return undefined;
    }
    let cancelled = false;
    const image = new Image();
    const applyPreview = () => {
      if (!cancelled) setStablePreview({ src: previewSrc, alt: previewAlt });
    };
    image.onload = applyPreview;
    image.onerror = applyPreview;
    image.src = previewSrc;
    return () => { cancelled = true; };
  }, [previewSrc, previewAlt, stablePreview.src, stablePreview.alt]);

  const parsedPrice = Number(previewItem?.price);
  const hasPrice = previewItem?.price !== null && previewItem?.price !== undefined &&
    previewItem?.price !== "" && Number.isFinite(parsedPrice);

  return {
    selectedClothing, selectedColor, selectedSize,
    setSelectedSize,
    baseTypeOptions, colorOptions, sizeOptions, availableSizes,
    canProceed,
    displayPreviewSrc: stablePreview.src || figmaTshirtImg,
    displayPreviewAlt: stablePreview.src ? stablePreview.alt || previewAlt : "Чёрная футболка",
    displayPrice: hasPrice ? `${parsedPrice} руб` : "уточняется",
    handleSelectClothing: (value) => {
      setSelectedClothing(value); setSelectedColor(""); setSelectedSize("");
    },
    handleSelectColor: (value) => { setSelectedColor(value); setSelectedSize(""); },
  };
};
