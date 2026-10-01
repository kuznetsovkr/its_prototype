import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { IS_DEMO_MODE } from "../../../config/demoMode";
import { useOrder } from "../../../context/OrderContext";
import { getEmbroideryPrices } from "./embroideryApi";
import { getEmbroideryCountError, getPatronusLimit } from "./embroideryLimits";
import {
  isSameFiles,
  isSameOptions,
  selectUploadFiles,
} from "./embroideryConfig";

const priceFormatter = new Intl.NumberFormat("ru-RU");
const emptyCustomOption = () => ({ image: false, text: false });

export const useEmbroiderySelection = () => {
  const location = useLocation();
  const {
    order,
    setEmbroidery,
    missingUploadFiles,
    dismissMissingUploadFiles,
  } = useOrder();
  const { clothing, embroidery } = order;
  const selectedClothing = location.state?.selectedClothing;
  const patronusLimit = getPatronusLimit(clothing.profile);
  const previousTypeRef = useRef(null);
  const skipExternalSyncRef = useRef(false);
  const [selectedType, setSelectedType] = useState(embroidery.type || "");
  const [customText, setCustomText] = useState(embroidery.customText || "");
  const [uploadedImage, setUploadedImage] = useState(embroidery.uploadedImage || []);
  const [comment, setComment] = useState(embroidery.comment || "");
  const [error, setError] = useState("");
  const [patronusCount, setPatronusCount] = useState(
    Math.min(Math.max(1, embroidery.patronusCount || 1), patronusLimit)
  );
  const [petFaceCount, setPetFaceCount] = useState(embroidery.petFaceCount || 1);
  const [customOption, setCustomOption] = useState(embroidery.customOption || emptyCustomOption());
  const [customTextFont, setCustomTextFont] = useState(embroidery.customTextFont || "Arial");
  const [serverPrices, setServerPrices] = useState(null);
  const [priceLoading, setPriceLoading] = useState(!IS_DEMO_MODE);
  const [priceError, setPriceError] = useState("");

  const isCustomType = selectedType === "custom";
  const priceRequestKey = JSON.stringify([
    clothing.type || selectedClothing, clothing.color, clothing.size, patronusCount, petFaceCount,
  ]);

  useEffect(() => {
    setPatronusCount((current) => Math.min(Math.max(1, current), patronusLimit));
  }, [patronusLimit]);

  useEffect(() => {
    if (IS_DEMO_MODE) {
      setPriceLoading(false);
      setPriceError("");
      return undefined;
    }

    const productType = clothing.type || selectedClothing;
    if (!productType || !clothing.color || !clothing.size) {
      setServerPrices(null);
      setPriceLoading(false);
      setPriceError("Не удалось определить выбранное изделие");
      return undefined;
    }

    let cancelled = false;
    setPriceLoading(true);
    setPriceError("");
    getEmbroideryPrices({
      productType,
      color: clothing.color,
      size: clothing.size,
      patronusCount,
      petFaceCount,
    }).then((prices) => {
      if (!cancelled) {
        setServerPrices({ key: priceRequestKey, prices });
        setPriceLoading(false);
      }
    }).catch((requestError) => {
      if (!cancelled) {
        setServerPrices(null);
        setPriceLoading(false);
        setPriceError(requestError.message || "Не удалось рассчитать стоимость");
      }
    });
    return () => { cancelled = true; };
  }, [clothing.type, clothing.color, clothing.size, clothing.profile, selectedClothing,
    patronusCount, petFaceCount, priceRequestKey]);

  const calcPrice = useCallback((type) => {
    if (!type) return null;
    const prices = IS_DEMO_MODE ? clothing.profile?.prices :
      serverPrices?.key === priceRequestKey ? serverPrices.prices : null;
    const basePrice = prices?.[type];
    if (basePrice == null || !Number.isFinite(Number(basePrice))) return null;
    if (IS_DEMO_MODE && type === "Patronus") {
      return Number(basePrice) + Math.max(0, patronusCount - 1) * 5000;
    }
    if (IS_DEMO_MODE && type === "petFace") {
      return Number(basePrice) + Math.max(0, petFaceCount - 1) * 2000;
    }
    return Number(basePrice);
  }, [clothing.profile, patronusCount, petFaceCount, priceRequestKey, serverPrices]);

  const selectedPrice = calcPrice(selectedType);
  const countError = getEmbroideryCountError({
    type: selectedType, patronusCount, petFaceCount, patronusLimit,
  });
  const hasFiles = uploadedImage.length > 0;
  const hasCustomText = customText.trim().length > 0;
  const mustUpload = isCustomType && customOption.image;
  const mustText = isCustomType && customOption.text;
  const mustSelectCustom = isCustomType ? customOption.image || customOption.text : true;
  const customIsValid = mustSelectCustom && (!mustUpload || hasFiles) && (!mustText || hasCustomText);
  const canProceed = !countError && (IS_DEMO_MODE
    ? Boolean(selectedType && (isCustomType || selectedPrice != null))
    : isCustomType
      ? customIsValid
      : Boolean(selectedType && hasFiles && selectedPrice != null && !priceLoading));

  let disabledHint = countError || "";
  if (!selectedType) disabledHint = "Выберите тип вышивки";
  else if (!countError && !IS_DEMO_MODE) {
    if (priceLoading) disabledHint = "Дождитесь расчёта стоимости";
    else if (priceError) disabledHint = priceError;
    else if (!isCustomType && !hasFiles) disabledHint = "Загрузите хотя бы одно изображение";
    else if (isCustomType && !mustSelectCustom) disabledHint = "Выберите: изображение или надпись";
    else if (mustUpload && !hasFiles) disabledHint = "Загрузите изображение";
    else if (mustText && !hasCustomText) disabledHint = "Введите текст для вышивки";
  }

  const addFiles = (incomingFiles) => {
    setUploadedImage((currentFiles) => {
      const result = selectUploadFiles({ currentFiles, incomingFiles, selectedType });
      setError(result.error);
      return result.files;
    });
  };
  const handleFileChange = (event) => {
    addFiles(Array.from(event.target.files || []));
    event.target.value = "";
  };
  const handleFileDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };
  const handleFileDrop = (event) => {
    event.preventDefault();
    addFiles(Array.from(event.dataTransfer.files || []));
  };
  const handleRemoveImage = (index) => {
    setUploadedImage((current) => current.filter((_, imageIndex) => imageIndex !== index));
  };

  useEffect(() => {
    const nextEmbroidery = {
      type: selectedType,
      typeSelectionExplicit: Boolean(selectedType),
      customText,
      customTextFont,
      comment,
      uploadedImage,
      patronusCount,
      petFaceCount,
      customOption,
      price: calcPrice(selectedType),
    };
    const currentOption = embroidery.customOption || emptyCustomOption();
    const sameState =
      (embroidery.type || "") === nextEmbroidery.type &&
      Boolean(embroidery.typeSelectionExplicit) === nextEmbroidery.typeSelectionExplicit &&
      (embroidery.customText || "") === nextEmbroidery.customText &&
      (embroidery.customTextFont || "Arial") === nextEmbroidery.customTextFont &&
      (embroidery.comment || "") === nextEmbroidery.comment &&
      (embroidery.patronusCount || 1) === nextEmbroidery.patronusCount &&
      (embroidery.petFaceCount || 1) === nextEmbroidery.petFaceCount &&
      (embroidery.price ?? null) === nextEmbroidery.price &&
      isSameFiles(embroidery.uploadedImage || [], nextEmbroidery.uploadedImage) &&
      isSameOptions(currentOption, nextEmbroidery.customOption);
    if (!sameState) {
      skipExternalSyncRef.current = true;
      setEmbroidery(nextEmbroidery);
    }
  }, [selectedType, customText, customTextFont, comment, uploadedImage, patronusCount,
    petFaceCount, customOption, embroidery.type, embroidery.typeSelectionExplicit, embroidery.customText,
    embroidery.customTextFont, embroidery.comment, embroidery.uploadedImage,
    embroidery.patronusCount, embroidery.petFaceCount, embroidery.customOption,
    embroidery.price, setEmbroidery, calcPrice]);

  useEffect(() => {
    const next = {
      type: embroidery.type || "",
      customText: embroidery.customText || "",
      uploadedImage: embroidery.uploadedImage || [],
      comment: embroidery.comment || "",
      patronusCount: embroidery.patronusCount || 1,
      petFaceCount: embroidery.petFaceCount || 1,
      customOption: embroidery.customOption || emptyCustomOption(),
      customTextFont: embroidery.customTextFont || "Arial",
    };
    const inSync = selectedType === next.type && customText === next.customText &&
      isSameFiles(uploadedImage, next.uploadedImage) && comment === next.comment &&
      patronusCount === next.patronusCount && petFaceCount === next.petFaceCount &&
      isSameOptions(customOption, next.customOption) && customTextFont === next.customTextFont;
    if (inSync) {
      skipExternalSyncRef.current = false;
      return;
    }
    if (skipExternalSyncRef.current) {
      skipExternalSyncRef.current = false;
      return;
    }
    if (selectedType !== next.type) setSelectedType(next.type);
    if (customText !== next.customText) setCustomText(next.customText);
    if (!isSameFiles(uploadedImage, next.uploadedImage)) setUploadedImage(next.uploadedImage);
    if (comment !== next.comment) setComment(next.comment);
    if (patronusCount !== next.patronusCount) setPatronusCount(next.patronusCount);
    if (petFaceCount !== next.petFaceCount) setPetFaceCount(next.petFaceCount);
    if (!isSameOptions(customOption, next.customOption)) setCustomOption(next.customOption);
    if (customTextFont !== next.customTextFont) setCustomTextFont(next.customTextFont);
  }, [embroidery.type, embroidery.customText, embroidery.uploadedImage, embroidery.comment,
    embroidery.patronusCount, embroidery.petFaceCount, embroidery.customOption,
    embroidery.customTextFont, selectedType, customText, uploadedImage, comment,
    patronusCount, petFaceCount, customOption, customTextFont]);

  useEffect(() => {
    if (previousTypeRef.current && previousTypeRef.current !== selectedType) {
      setPatronusCount(1);
      setPetFaceCount(1);
      if (selectedType !== "custom") {
        setCustomOption(emptyCustomOption());
        setCustomText("");
        setCustomTextFont("Arial");
      }
    }
    previousTypeRef.current = selectedType;
  }, [selectedType]);

  const handleSelectType = (type) => {
    setSelectedType(type);
    setPatronusCount(1);
    setPetFaceCount(1);
  };

  return {
    hasClothingSelection: Boolean(clothing.type && clothing.color && clothing.size),
    clothingPreviewSrc: clothing.previewSrc || "",
    clothingPreviewAlt: clothing.previewAlt || clothing.type || "Одежда",
    selectedType, customText, setCustomText, uploadedImage, setUploadedImage,
    comment, setComment, error, countError, patronusCount, setPatronusCount,
    petFaceCount, setPetFaceCount, customOption, setCustomOption,
    customTextFont, setCustomTextFont, patronusLimit,
    isCustomType, hasFiles, canProceed, disabledHint, priceError,
    desktopPriceLabel: !selectedType ? "" : isCustomType
      ? "Цена рассчитает менеджер"
      : selectedPrice == null ? "Цена рассчитывается…" : `Цена: ${priceFormatter.format(selectedPrice)} руб`,
    priceLabel: (type) => {
      const value = calcPrice(type);
      return value == null ? "рассчитываем…" : `${priceFormatter.format(value)} ₽`;
    },
    customPriceNote: "стоимость рассчитает менеджер",
    handleSelectType, handleFileChange, handleFileDragOver, handleFileDrop, handleRemoveImage,
    missingUploadFiles, dismissMissingUploadFiles,
  };
};
