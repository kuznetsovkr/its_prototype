import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  (a?.email || "") === (b?.email || "") &&
  (a?.preferredContact || "") === (b?.preferredContact || "") &&
  (a?.orderComment || "") === (b?.orderComment || "") &&
  (a?.city || "") === (b?.city || "") &&
  (a?.deliveryRecipient || "") === (b?.deliveryRecipient || "") &&
  (a?.deliveryComment || "") === (b?.deliveryComment || "") &&
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
    type: "Patronus",
    customText: "",
    customTextFont: "Arial",
    comment: "",
    uploadedImage: [],
    patronusCount: 1,
    petFaceCount: 1,
    price: 0,
    customOption: {
      image: false,
      text: false,
    },
  },
  recipient: {
    userData: { firstName: "", lastName: "", middleName: "", phone: "" },
    email: "",
    preferredContact: "",
    orderComment: "",
    city: "",
    deliveryRecipient: "",
    deliveryComment: "",
    privacyConsent: false,
    pickupPoint: "",
    deliveryPrice: null,
    manualAddress: null,
    isNoCdek: false,
    cdek: null,
  },
};

const createInitialState = () => ({
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

const restoreOrderDraft = () => {
  const emptyDraft = { order: createInitialState(), missingUploadFiles: [] };
  if (typeof window === "undefined") return emptyDraft;

  try {
    const rawDraft = window.sessionStorage.getItem(ORDER_DRAFT_STORAGE_KEY);
    if (!rawDraft) return emptyDraft;

    const draft = JSON.parse(rawDraft);
    if (draft?.version !== ORDER_DRAFT_VERSION || !draft.order) return emptyDraft;

    const storedOrder = draft.order;
    return {
      order: {
        clothing: {
          ...initialState.clothing,
          ...(storedOrder.clothing || {}),
        },
        embroidery: {
          ...initialState.embroidery,
          ...(storedOrder.embroidery || {}),
          uploadedImage: [],
          customOption: {
            ...initialState.embroidery.customOption,
            ...(storedOrder.embroidery?.customOption || {}),
          },
        },
        recipient: {
          ...initialState.recipient,
          ...(storedOrder.recipient || {}),
          userData: {
            ...initialState.recipient.userData,
            ...(storedOrder.recipient?.userData || {}),
          },
          manualAddress: normalizeManualAddress(storedOrder.recipient?.manualAddress, null),
        },
      },
      missingUploadFiles: normalizeUploadMetadata(draft.uploadFiles),
    };
  } catch {
    window.sessionStorage.removeItem(ORDER_DRAFT_STORAGE_KEY);
    return emptyDraft;
  }
};

const createOrderDraft = (order, missingUploadFiles) => {
  const currentFiles = normalizeUploadMetadata(order.embroidery.uploadedImage);

  return {
    version: ORDER_DRAFT_VERSION,
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
  const restoredDraft = useMemo(restoreOrderDraft, []);
  const [order, setOrder] = useState(restoredDraft.order);
  const [missingUploadFiles, setMissingUploadFiles] = useState(
    restoredDraft.missingUploadFiles
  );

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        ORDER_DRAFT_STORAGE_KEY,
        JSON.stringify(createOrderDraft(order, missingUploadFiles))
      );
    } catch {
      // sessionStorage may be unavailable or full. The in-memory order still works.
    }
  }, [order, missingUploadFiles]);

  useEffect(() => {
    if (order.embroidery.uploadedImage.length === 0) return undefined;

    const warnBeforeFileLoss = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeFileLoss);
    return () => window.removeEventListener("beforeunload", warnBeforeFileLoss);
  }, [order.embroidery.uploadedImage.length]);

  const setClothing = useCallback((payload) => {
    setOrder((prev) => {
      const next = { ...prev.clothing, ...payload };
      if (isSameClothing(next, prev.clothing)) return prev;
      return { ...prev, clothing: next };
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
        customOption: payload?.customOption
          ? { ...prev.embroidery.customOption, ...payload.customOption }
          : prev.embroidery.customOption,
      };
      if (isSameEmbroidery(next, prev.embroidery)) return prev;
      return { ...prev, embroidery: next };
    });
  }, []);

  const setRecipient = useCallback((payload) => {
    setOrder((prev) => {
      const next = {
        ...prev.recipient,
        ...payload,
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
    setMissingUploadFiles([]);
    setOrder(createInitialState());
    try {
      window.sessionStorage.removeItem(ORDER_DRAFT_STORAGE_KEY);
    } catch {
      // The order state is reset even when browser storage is unavailable.
    }
  }, []);

  const value = useMemo(
    () => ({
      order,
      setClothing,
      setEmbroidery,
      setRecipient,
      resetOrder,
      missingUploadFiles,
      dismissMissingUploadFiles,
    }),
    [
      order,
      setClothing,
      setEmbroidery,
      setRecipient,
      resetOrder,
      missingUploadFiles,
      dismissMissingUploadFiles,
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
