import { createContext, useContext, useMemo, useState, useCallback } from "react";

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
  (a?.innerType || "") === (b?.innerType || "") &&
  (a?.color || "") === (b?.color || "") &&
  (a?.size || "") === (b?.size || "");

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
    innerType: "",
    color: "",
    size: "",
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
    pickupPoint: "",
    deliveryPrice: null,
    manualAddress: null,
    isNoCdek: false,
    cdek: null,
  },
};

const OrderContext = createContext(null);

export const OrderProvider = ({ children }) => {
  const [order, setOrder] = useState(initialState);

  const setClothing = useCallback((payload) => {
    setOrder((prev) => {
      const next = { ...prev.clothing, ...payload };
      if (isSameClothing(next, prev.clothing)) return prev;
      return { ...prev, clothing: next };
    });
  }, []);

  const setEmbroidery = useCallback((payload) => {
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

  const resetOrder = useCallback(() => setOrder(initialState), []);

  const value = useMemo(
    () => ({
      order,
      setClothing,
      setEmbroidery,
      setRecipient,
      resetOrder,
    }),
    [order, setClothing, setEmbroidery, setRecipient, resetOrder]
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
