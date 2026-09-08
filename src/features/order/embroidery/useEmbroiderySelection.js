import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { IS_DEMO_MODE } from "../../../config/demoMode";
import { useOrder } from "../../../context/OrderContext";
import { getEmbroideryPrices } from "./embroideryApi";
import {
  DEMO_PRICE_MATRIX,
  detectClothingKey,
  isSameFiles,
  isSameOptions,
  selectUploadFiles,
} from "./embroideryConfig";

const priceFormatter = new Intl.NumberFormat("ru-RU");
const emptyCustomOption = () => ({ image: false, text: false });

export const useEmbroiderySelection = () => {
  const location = useLocation();
  const { order, setEmbroidery } = useOrder();
  const { clothing, embroidery } = order;
  const previousTypeRef = useRef(null);
  const skipExternalSyncRef = useRef(false);
  const [selectedType, setSelectedType] = useState(embroidery.type || "Patronus");
  const [customText, setCustomText] = useState(embroidery.customText || "");
  const [uploadedImage, setUploadedImage] = useState(embroidery.uploadedImage || []);
  const [comment, setComment] = useState(embroidery.comment || "");
  const [error, setError] = useState("");
  const [patronusCount, setPatronusCount] = useState(embroidery.patronusCount || 1);
  const [petFaceCount, setPetFaceCount] = useState(embroidery.petFaceCount || 1);
  const [customOption, setCustomOption] = useState(embroidery.customOption || emptyCustomOption());
  const [customTextFont, setCustomTextFont] = useState(embroidery.customTextFont || "Arial");
  const [serverPrices, setServerPrices] = useState(null);
  const [priceLoading, setPriceLoading] = useState(!IS_DEMO_MODE);
  const [priceError, setPriceError] = useState("");

  const selectedClothing = location.state?.selectedClothing;
  const clothingKey = detectClothingKey(clothing.type || selectedClothing);
  const patronusLimit = clothingKey === "tshirt" ? 1 : 5;
  const patronusLimitText = clothingKey === "tshirt" ? "на футболке не более 1" : "не более 5";
  const isCustomType = selectedType === "custom";

  useEffect(() => {
    setPatronusCount((current) => Math.min(Math.max(1, current), patronusLimit));
  }, [patronusLimit]);

  useEffect(() => {
    if (IS_DEMO_MODE) {
      setServerPrices({
        Patronus: DEMO_PRICE_MATRIX.Patronus[clothingKey] + Math.max(0, patronusCount - 1) * 5000,
        Car: DEMO_PRICE_MATRIX.Car[clothingKey],
        petFace: DEMO_PRICE_MATRIX.petFace[clothingKey] + Math.max(0, petFaceCount - 1) * 2000,
      });
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
        setServerPrices(prices);
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
  }, [clothing.type, clothing.color, clothing.size, selectedClothing, clothingKey,
    patronusCount, petFaceCount]);

  const calcPrice = useCallback((type) => {
    const value = serverPrices?.[type];
    return Number.isFinite(Number(value)) ? Number(value) : null;
  }, [serverPrices]);

  const selectedPrice = calcPrice(selectedType);
  const hasFiles = uploadedImage.length > 0;
  const hasCustomText = customText.trim().length > 0;
  const mustUpload = isCustomType && customOption.image;
  const mustText = isCustomType && customOption.text;
  const mustSelectCustom = isCustomType ? customOption.image || customOption.text : true;
  const customIsValid = mustSelectCustom && (!mustUpload || hasFiles) && (!mustText || hasCustomText);
  const canProceed = IS_DEMO_MODE
    ? Boolean(selectedType && (isCustomType || selectedPrice != null))
    : isCustomType
      ? customIsValid
      : Boolean(selectedType && hasFiles && selectedPrice != null && !priceLoading);

  let disabledHint = "";
  if (!IS_DEMO_MODE) {
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
      (embroidery.type || "Patronus") === nextEmbroidery.type &&
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
    petFaceCount, customOption, embroidery.type, embroidery.customText,
    embroidery.customTextFont, embroidery.comment, embroidery.uploadedImage,
    embroidery.patronusCount, embroidery.petFaceCount, embroidery.customOption,
    embroidery.price, setEmbroidery, calcPrice]);

  useEffect(() => {
    const next = {
      type: embroidery.type || "Patronus",
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
    selectedType, customText, setCustomText, uploadedImage, setUploadedImage,
    comment, setComment, error, patronusCount, setPatronusCount,
    petFaceCount, setPetFaceCount, customOption, setCustomOption,
    customTextFont, setCustomTextFont, patronusLimit, patronusLimitText,
    isCustomType, hasFiles, canProceed, disabledHint, priceError,
    desktopPriceLabel: isCustomType
      ? "Цена рассчитает менеджер"
      : selectedPrice == null ? "Цена рассчитывается…" : `Цена: ${priceFormatter.format(selectedPrice)} руб`,
    priceLabel: (type) => {
      const value = calcPrice(type);
      return value == null ? "рассчитываем…" : `${priceFormatter.format(value)} ₽`;
    },
    customPriceNote: "стоимость рассчитает менеджер",
    handleSelectType, handleFileChange, handleFileDragOver, handleFileDrop, handleRemoveImage,
  };
};
