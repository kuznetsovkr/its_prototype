import { createContext, useContext, useMemo, useState, useCallback } from "react";

const isEqual = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

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
      if (isEqual(next, prev.clothing)) return prev;
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
      if (isEqual(next, prev.embroidery)) return prev;
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
      if (isEqual(next, prev.recipient)) return prev;
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
