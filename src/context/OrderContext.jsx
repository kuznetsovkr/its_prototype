import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getOrderAccessToken } from "../utils/orderAccess";
import { restoreDeliveryMethod } from "../config/delivery";
import { normalizeDeliveryCity } from "../features/order/recipient/deliveryCity";
import { DEFAULT_CUSTOM_TEXT_FONT, normalizeCustomText, normalizeCustomTextFont } from "../features/order/embroidery/customTextFonts";
import { createCartItemKey } from "../features/cart/cartItem";
import { getCartStorage, isCartId } from "../features/cart/cartStorage";
import { CONSTRUCTOR_DRAFT_KEY, createConstructorDraftStore } from "../features/cart/constructorDraft";

const ORDER_DRAFT_STORAGE_KEY = "its_order_draft_v1";
const ORDER_DRAFT_VERSION = 1;

const fileSignature = (file) => {
  if (!file) return "";
  if (typeof file === "string") return `str:${file}`;
  const name = file.name || "";
  const size = Number(file.size || 0);
  const lastModified = Number(file.lastModified || 0);
  return `file:${name}:${size}:${lastModified}`;
};

const isSameFiles = (a = [], b = []) => {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  return a.every((file, idx) => fileSignature(file) === fileSignature(b[idx]));
};

const isSameManualAddress = (a, b) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    (a.value || "") === (b.value || "") &&
    (a.data?.house || "") === (b.data?.house || "") &&
    (a.data?.block || "") === (b.data?.block || "") &&
    (a.data?.flat || "") === (b.data?.flat || "")
  );
};

const isSameClothing = (a, b) =>
  (a?.type || "") === (b?.type || "") &&
  (a?.color || "") === (b?.color || "") &&
  (a?.size || "") === (b?.size || "") &&
  JSON.stringify(a?.profile ?? null) === JSON.stringify(b?.profile ?? null) &&
  (a?.previewSrc || "") === (b?.previewSrc || "") &&
  (a?.previewAlt || "") === (b?.previewAlt || "");

const isSameEmbroidery = (a, b) =>
  (a?.type || "") === (b?.type || "") &&
  Boolean(a?.typeSelectionExplicit) === Boolean(b?.typeSelectionExplicit) &&
  (a?.customText || "") === (b?.customText || "") &&
  (a?.customTextFont || "") === (b?.customTextFont || "") &&
  (a?.comment || "") === (b?.comment || "") &&
  Number(a?.patronusCount || 0) === Number(b?.patronusCount || 0) &&
  Number(a?.petFaceCount || 0) === Number(b?.petFaceCount || 0) &&
  Number(a?.price || 0) === Number(b?.price || 0) &&
  Boolean(a?.customOption?.image) === Boolean(b?.customOption?.image) &&
  Boolean(a?.customOption?.text) === Boolean(b?.customOption?.text) &&
  isSameFiles(a?.uploadedImage || [], b?.uploadedImage || []);

const isSameRecipient = (a, b) =>
  (a?.userData?.firstName || "") === (b?.userData?.firstName || "") &&
  (a?.userData?.lastName || "") === (b?.userData?.lastName || "") &&
  (a?.userData?.middleName || "") === (b?.userData?.middleName || "") &&
  (a?.userData?.phone || "") === (b?.userData?.phone || "") &&
  Boolean(a?.hasNoMiddleName) === Boolean(b?.hasNoMiddleName) &&
  Boolean(a?.hasOtherRecipient) === Boolean(b?.hasOtherRecipient) &&
  (a?.email || "") === (b?.email || "") &&
  (a?.preferredContact || "") === (b?.preferredContact || "") &&
  (a?.orderComment || "") === (b?.orderComment || "") &&
  (a?.deliveryRecipient || "") === (b?.deliveryRecipient || "") &&
  (a?.recipientPhone || "") === (b?.recipientPhone || "") &&
  (a?.deliveryComment || "") === (b?.deliveryComment || "") &&
  (a?.deliveryMethod || "") === (b?.deliveryMethod || "") &&
  JSON.stringify(a?.deliveryCity ?? null) === JSON.stringify(b?.deliveryCity ?? null) &&
  (a?.postalPoint || "") === (b?.postalPoint || "") &&
  (a?.certificateCode || "") === (b?.certificateCode || "") &&
  JSON.stringify(a?.savedOrder ?? null) === JSON.stringify(b?.savedOrder ?? null) &&
  Boolean(a?.privacyConsent) === Boolean(b?.privacyConsent) &&
  (a?.pickupPoint || "") === (b?.pickupPoint || "") &&
  Number(a?.deliveryPrice ?? 0) === Number(b?.deliveryPrice ?? 0) &&
  Boolean(a?.isNoCdek) === Boolean(b?.isNoCdek) &&
  isSameManualAddress(a?.manualAddress, b?.manualAddress) &&
  JSON.stringify(a?.cdek ?? null) === JSON.stringify(b?.cdek ?? null);

const normalizeManualAddress = (value, fallback) => {
  if (value === undefined) return fallback;
  if (!value) return null;
  const data = value.data || {};
  return {
    value: value.value || "",
    data: {
      house: data.house || "",
      block: data.block || "",
      flat: data.flat || "",
    },
  };
};

const initialState = {
  clothing: {
    type: "",
    color: "",
    size: "",
    profile: null,
    previewSrc: "",
    previewAlt: "",
  },
  embroidery: {
    type: "",
    typeSelectionExplicit: false,
    customText: "",
    customTextFont: DEFAULT_CUSTOM_TEXT_FONT,
    comment: "",
    uploadedImage: [],
    patronusCount: 1,
    petFaceCount: 1,
    price: null,
    customOption: {
      image: false,
      text: false,
    },
  },
  recipient: {
    userData: { firstName: "", lastName: "", middleName: "", phone: "" },
    hasNoMiddleName: false,
    hasOtherRecipient: false,
    email: "",
    preferredContact: "",
    orderComment: "",
    deliveryRecipient: "",
    recipientPhone: "",
    deliveryComment: "",
    deliveryMethod: "cdek",
    deliveryCity: null,
    postalPoint: "",
    certificateCode: "",
    savedOrder: null,
    privacyConsent: false,
    pickupPoint: "",
    deliveryPrice: null,
    manualAddress: null,
    isNoCdek: false,
    cdek: null,
  },
};

const createInitialState = () => ({
  cartItemKey: createCartItemKey(),
  clothing: { ...initialState.clothing },
  embroidery: {
    ...initialState.embroidery,
    uploadedImage: [],
    customOption: { ...initialState.embroidery.customOption },
  },
  recipient: {
    ...initialState.recipient,
    userData: { ...initialState.recipient.userData },
  },
});

const normalizeUploadMetadata = (files) => {
  if (!Array.isArray(files)) return [];

  return files
    .map((file) => ({
      name: String(file?.name || "").slice(0, 255),
      size: Math.max(0, Number(file?.size || 0)),
      lastModified: Math.max(0, Number(file?.lastModified || 0)),
    }))
    .filter((file) => file.name);
};

const restoreOrderDraft = (persistentStore) => {
  const persistent = persistentStore.initialDraft;
  const initialOrder = createInitialState();
  const emptyDraft = { order: persistent ? { ...initialOrder, cartItemKey: persistent.cartItemKey,
    clothing: { ...initialOrder.clothing, ...persistent.clothing },
    embroidery: { ...initialOrder.embroidery, ...persistent.embroidery, price: null, uploadedImage: [] } } : initialOrder,
    missingUploadFiles: persistent?.uploadFiles || [] };
  if (typeof window === "undefined") return emptyDraft;

  try {
    const rawDraft = window.sessionStorage.getItem(ORDER_DRAFT_STORAGE_KEY);
    if (!rawDraft) return emptyDraft;

    const draft = JSON.parse(rawDraft);
    if (draft?.version !== ORDER_DRAFT_VERSION || !draft.order) return emptyDraft;
    // A completed/removed or changed constructor in another tab must not be
    // resurrected from an older tab's sessionStorage. Legacy drafts migrate only
    // when no newer persistent record (including a completion tombstone) exists.
    if (draft.constructorRevision === undefined && persistentStore.getRevision() !== null) return emptyDraft;
    if (draft.constructorRevision !== undefined && draft.constructorRevision !== persistentStore.getRevision()) return emptyDraft;
    if (persistentStore.initialExpired && !draft.order.recipient?.savedOrder) return emptyDraft;

    const storedOrder = draft.order;
    const storedEmbroidery = storedOrder.embroidery || {};
    const savedOrder = storedOrder.recipient?.savedOrder;
    const hasSavedOrder = Boolean(savedOrder?.orderId && savedOrder?.orderToken === getOrderAccessToken(savedOrder.orderId));
    // Older drafts defaulted to Patronus without a user selection. Do not restore that
    // implicit choice as a visible price; preserve drafts with evidence of a real choice.
    const hasSelectedType = storedEmbroidery.typeSelectionExplicit === true ||
      (storedEmbroidery.typeSelectionExplicit === undefined && Boolean(storedEmbroidery.type) &&
        (storedEmbroidery.type !== "Patronus" ||
          Number(storedEmbroidery.patronusCount) > 1 ||
          Boolean(draft.uploadFiles?.length) ||
          Boolean(storedOrder.recipient?.userData?.firstName)));
    return {
      order: {
        cartItemKey: isCartId(storedOrder.cartItemKey) ? storedOrder.cartItemKey : createCartItemKey(),
        clothing: {
          ...initialState.clothing,
          ...(storedOrder.clothing || {}),
        },
        embroidery: {
          ...initialState.embroidery,
          ...storedEmbroidery,
          customText: normalizeCustomText(storedEmbroidery.customText, storedEmbroidery.customTextFont),
          customTextFont: normalizeCustomTextFont(storedEmbroidery.customTextFont),
          type: hasSelectedType ? storedEmbroidery.type : "",
          typeSelectionExplicit: hasSelectedType,
          price: null,
          uploadedImage: [],
          customOption: {
            ...initialState.embroidery.customOption,
            ...(storedOrder.embroidery?.customOption || {}),
          },
        },
        recipient: {
          ...initialState.recipient,
          ...(storedOrder.recipient || {}),
          deliveryMethod: restoreDeliveryMethod(storedOrder.recipient),
          deliveryCity: normalizeDeliveryCity(storedOrder.recipient?.deliveryCity),
          userData: {
            ...initialState.recipient.userData,
            ...(storedOrder.recipient?.userData || {}),
          },
          manualAddress: normalizeManualAddress(storedOrder.recipient?.manualAddress, null),
        },
      },
      missingUploadFiles: hasSavedOrder ? [] : normalizeUploadMetadata(draft.uploadFiles),
    };
  } catch {
    try { window.sessionStorage.removeItem(ORDER_DRAFT_STORAGE_KEY); } catch { /* Storage can be blocked. */ }
    return emptyDraft;
  }
};

const createOrderDraft = (order, missingUploadFiles, constructorRevision) => {
  const currentFiles = normalizeUploadMetadata(order.embroidery.uploadedImage);

  return {
    version: ORDER_DRAFT_VERSION,
    constructorRevision,
    order: {
      ...order,
      embroidery: {
        ...order.embroidery,
        uploadedImage: [],
      },
    },
    uploadFiles: currentFiles.length > 0 ? currentFiles : missingUploadFiles,
  };
};

const OrderContext = createContext(null);

export const OrderProvider = ({ children }) => {
  const [persistentStore] = useState(() => createConstructorDraftStore({ storage: getCartStorage() }));
  const restoredDraft = useMemo(() => restoreOrderDraft(persistentStore), [persistentStore]);
  const [order, setOrder] = useState(restoredDraft.order);
  const [constructorResetCount, setConstructorResetCount] = useState(0);
  const [constructorDraftError, setConstructorDraftError] = useState("");
  const [missingUploadFiles, setMissingUploadFiles] = useState(
    restoredDraft.missingUploadFiles
  );

  useEffect(() => {
    const result = persistentStore.save(order, missingUploadFiles);
    setConstructorDraftError(result.error);
    try {
      window.sessionStorage.setItem(
        ORDER_DRAFT_STORAGE_KEY,
        JSON.stringify(createOrderDraft(order, missingUploadFiles, persistentStore.getRevision()))
      );
    } catch {
      // sessionStorage may be unavailable or full. The in-memory order still works.
    }
  }, [order, missingUploadFiles, persistentStore]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === null || event.key === CONSTRUCTOR_DRAFT_KEY) setConstructorDraftError(persistentStore.checkConflict());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [persistentStore]);

  useEffect(() => {
    if (order.embroidery.uploadedImage.length === 0 || order.recipient.savedOrder) return undefined;

    const warnBeforeFileLoss = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeFileLoss);
    return () => window.removeEventListener("beforeunload", warnBeforeFileLoss);
  }, [order.embroidery.uploadedImage.length, order.recipient.savedOrder]);

  const setClothing = useCallback((payload) => {
    setOrder((prev) => {
      const next = { ...prev.clothing, ...payload };
      if (isSameClothing(next, prev.clothing)) return prev;
      const selectionChanged = next.type !== prev.clothing.type || next.color !== prev.clothing.color || next.size !== prev.clothing.size;
      return { ...prev, clothing: next, cartItemKey: selectionChanged ? createCartItemKey() : prev.cartItemKey,
        recipient: { ...prev.recipient, savedOrder: null } };
    });
  }, []);

  const setEmbroidery = useCallback((payload) => {
    if (Array.isArray(payload?.uploadedImage) && payload.uploadedImage.length > 0) {
      setMissingUploadFiles([]);
    }

    setOrder((prev) => {
      const next = {
        ...prev.embroidery,
        ...payload,
        customText: normalizeCustomText(payload?.customText ?? prev.embroidery.customText,
          payload?.customTextFont ?? prev.embroidery.customTextFont),
        customTextFont: normalizeCustomTextFont(payload?.customTextFont ?? prev.embroidery.customTextFont),
        customOption: payload?.customOption
          ? { ...prev.embroidery.customOption, ...payload.customOption }
          : prev.embroidery.customOption,
      };
      if (isSameEmbroidery(next, prev.embroidery)) return prev;
      const selectionChanged = next.type !== prev.embroidery.type || next.customText !== prev.embroidery.customText ||
        next.patronusCount !== prev.embroidery.patronusCount || next.petFaceCount !== prev.embroidery.petFaceCount ||
        next.customTextFont !== prev.embroidery.customTextFont || next.comment !== prev.embroidery.comment ||
        !isSameFiles(next.uploadedImage, prev.embroidery.uploadedImage) ||
        JSON.stringify(next.customOption) !== JSON.stringify(prev.embroidery.customOption);
      return { ...prev, embroidery: next, cartItemKey: selectionChanged ? createCartItemKey() : prev.cartItemKey,
        recipient: selectionChanged ? { ...prev.recipient, savedOrder: null } : prev.recipient };
    });
  }, []);

  const setRecipient = useCallback((payload) => {
    setOrder((prev) => {
      const next = {
        ...prev.recipient,
        ...payload,
        deliveryCity: payload?.deliveryCity !== undefined ? normalizeDeliveryCity(payload.deliveryCity) : prev.recipient.deliveryCity,
        userData: payload?.userData
          ? { ...prev.recipient.userData, ...payload.userData }
          : prev.recipient.userData,
        manualAddress: normalizeManualAddress(
          payload?.manualAddress,
          prev.recipient.manualAddress
        ),
        cdek: payload?.cdek !== undefined ? payload.cdek : prev.recipient.cdek,
      };
      if (isSameRecipient(next, prev.recipient)) return prev;
      return { ...prev, recipient: next };
    });
  }, []);

  const dismissMissingUploadFiles = useCallback(() => {
    setMissingUploadFiles([]);
  }, []);

  const resetOrder = useCallback(() => {
    setConstructorResetCount((value) => value + 1);
    setMissingUploadFiles([]);
    setOrder(createInitialState());
    try {
      window.sessionStorage.removeItem(ORDER_DRAFT_STORAGE_KEY);
    } catch {
      // The order state is reset even when browser storage is unavailable.
    }
  }, []);

  const resetCurrentItem = useCallback(() => {
    setConstructorResetCount((value) => value + 1);
    setMissingUploadFiles([]);
    setOrder((prev) => ({ ...createInitialState(), recipient: { ...prev.recipient, savedOrder: null } }));
  }, []);

  const value = useMemo(
    () => ({
      order,
      setClothing,
      setEmbroidery,
      setRecipient,
      resetOrder,
      resetCurrentItem,
      missingUploadFiles,
      dismissMissingUploadFiles,
      constructorResetCount,
      constructorDraftError,
    }),
    [
      order,
      setClothing,
      setEmbroidery,
      setRecipient,
      resetOrder,
      resetCurrentItem,
      missingUploadFiles,
      dismissMissingUploadFiles,
      constructorResetCount,
      constructorDraftError,
    ]
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};

export const useOrder = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) {
    throw new Error("useOrder must be used within OrderProvider");
  }
  return ctx;
};
