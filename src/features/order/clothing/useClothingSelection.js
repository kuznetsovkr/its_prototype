import { useEffect, useMemo, useState } from "react";
import { useOrder } from "../../../context/OrderContext";
import { buildImgSrc } from "../../../utils/url";
import { loadClothingCatalog } from "./clothingApi";
import {
  buildColorOptions,
  buildSizeOptions,
  hasStock,
  hasSizeGuide,
  isOrderableProfile,
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

  const baseTypeOptions = useMemo(() => {
    const catalogOptions = clothingTypes
      .filter((item) => String(item?.name || "").trim())
      .map((profile) => ({ label: String(profile.name).trim(), profile }));
    const inventoryOptions = inventory
      .filter((item) => String(item?.productType || "").trim())
      .map((item) => ({
        label: String(item.productType).trim(),
        profile: item.clothingType || null,
      }));
    return uniqBy([...catalogOptions, ...inventoryOptions], (option) => normalizeKey(option.label))
      .sort((a, b) =>
        Number(a.profile?.displayOrder ?? 10_000) - Number(b.profile?.displayOrder ?? 10_000) ||
        a.label.localeCompare(b.label, "ru")
      )
      .map((option) => ({
        ...option,
        isAvailable: isOrderableProfile(option.profile) && inStockInventory.some(
          (item) => normalizeKey(item.productType) === normalizeKey(option.label)
        ),
        disabledReason: isOrderableProfile(option.profile)
          ? "Нет в наличии"
          : "Параметры изделия пока не настроены",
      }));
  }, [clothingTypes, inventory, inStockInventory]);

  const selectedTypeProfile = useMemo(
    () => baseTypeOptions.find((option) =>
      normalizeKey(option.label) === normalizeKey(selectedClothing))?.profile || null,
    [baseTypeOptions, selectedClothing]
  );

  const sizeGuideOptions = useMemo(() => uniqBy(
    baseTypeOptions
      .filter((option) => hasSizeGuide(option.profile?.sizeGuideKey))
      .map((option) => ({
        key: option.profile.sizeGuideKey,
        label: option.label,
      })),
    (option) => option.key
  ), [baseTypeOptions]);

  const filteredByType = useMemo(
    () => inventory.filter(
      (item) => normalizeKey(item.productType) === normalizeKey(selectedClothing)
    ),
    [inventory, selectedClothing]
  );

  const sizeOptions = useMemo(
    () => buildSizeOptions(filteredByType),
    [filteredByType]
  );

  const colorOptions = useMemo(() => {
    return buildColorOptions(filteredByType, colorCatalog);
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
      .catch((error) => {
        console.error("Error loading inventory:", error);
        if (!cancelled) setInventoryLoaded(true);
      });
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
      profile: selectedTypeProfile,
    };
    const isSame =
      (clothing.type || "") === (next.type || "") &&
      (clothing.color || "") === (next.color || "") &&
      (clothing.size || "") === (next.size || "") &&
      JSON.stringify(clothing.profile ?? null) === JSON.stringify(next.profile ?? null);
    if (isSame) return;
    setClothing(next);
  }, [selectedClothing, selectedColor, selectedSize, selectedTypeProfile, setClothing,
    clothing.type, clothing.color, clothing.size, clothing.profile]);

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

  useEffect(() => {
    if (!inventoryLoaded) return;
    setClothing({
      previewSrc: previewSrc || "",
      previewAlt: previewSrc ? previewAlt : "",
    });
  }, [inventoryLoaded, previewSrc, previewAlt, setClothing]);

  return {
    selectedClothing, selectedColor, selectedSize,
    setSelectedSize,
    baseTypeOptions, colorOptions, sizeOptions, availableSizes,
    selectedTypeProfile, sizeGuideOptions,
    canProceed,
    isPreviewLoading: !inventoryLoaded,
    displayPreviewSrc: stablePreview.src || previewSrc || clothing.previewSrc || "",
    displayPreviewAlt: stablePreview.alt || previewAlt || clothing.previewAlt || "Одежда",
    handleSelectClothing: (value) => {
      setSelectedClothing(value); setSelectedColor(""); setSelectedSize("");
    },
    handleSelectColor: (value) => { setSelectedColor(value); setSelectedSize(""); },
  };
};
