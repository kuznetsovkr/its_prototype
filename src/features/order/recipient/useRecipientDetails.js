import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IS_DEMO_MODE } from "../../../config/demoMode";
import { APP_ENV } from "../../../config/env";
import { useOrder } from "../../../context/OrderContext";
import { buildDemoCdekNumber, buildDemoOrderId } from "../../../mocks/demoData";
import { storeOrderAccessToken } from "../../../utils/orderAccess";
import { confirmOrder, createOrder, getPaymentLink } from "./recipientApi";
import { buildOrderFormData } from "./recipientOrderPayload";
import {
  deriveGoodsPreset,
  formatPhoneNumber,
  hasFullManualAddress,
  joinFullName,
  splitFullName,
  validateRecipient,
} from "./recipientValidation";

const EMBROIDERY_TYPE_RU = {
  Patronus: "Патронус",
  Car: "Автомобиль",
  petFace: "Мордочка питомца",
  custom: "Своя вышивка",
};

const DEMO_RECIPIENT_DATA = {
  firstName: "Ivan",
  lastName: "Ivanov",
  middleName: "Ivanovich",
  phone: "+7 (900) 123-45-67",
};

const DEMO_PICKUP_POINT = "Demo pickup point: Krasnoyarsk, Mira 1";
const DEMO_DELIVERY_PRICE = 390;

export const useRecipientDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { order, setRecipient } = useOrder();
  const { clothing, embroidery, recipient: recipientState } = order;
  const locationState = location.state || {};

  const productType = clothing.type || locationState.productType;
  const color = clothing.color || locationState.color;
  const size = clothing.size || locationState.size;

  const selectedType = embroidery.type || locationState.selectedType;
  const isCustomType = selectedType === "custom";
  const customText = embroidery.customText || locationState.customText;
  const customOption = embroidery.customOption || locationState.customOption || { image: false, text: false };
  const uploadedImage = embroidery.uploadedImage || locationState.uploadedImage || [];
  const comment = embroidery.comment || locationState.comment;
  const patronusCount = embroidery.patronusCount || 0;
  const petFaceCount = embroidery.petFaceCount || 0;
  const embroideryTypeRu = EMBROIDERY_TYPE_RU[selectedType] || selectedType || "";

  const [userData, setUserData] = useState(() => {
    const base = recipientState.userData || { firstName: "", lastName: "", middleName: "", phone: "" };
    if (!IS_DEMO_MODE) return base;
    return {
      firstName: base.firstName || DEMO_RECIPIENT_DATA.firstName,
      lastName: base.lastName || DEMO_RECIPIENT_DATA.lastName,
      middleName: base.middleName || DEMO_RECIPIENT_DATA.middleName,
      phone: base.phone || DEMO_RECIPIENT_DATA.phone,
    };
  });
  const [fullNameInput, setFullNameInput] = useState(() => joinFullName(
    recipientState.userData || (IS_DEMO_MODE ? DEMO_RECIPIENT_DATA : {})
  ));
  const [email, setEmail] = useState(recipientState.email || "");
  const [preferredContact, setPreferredContact] = useState(recipientState.preferredContact || "");
  const [orderComment, setOrderComment] = useState(recipientState.orderComment || comment || "");
  const [city, setCity] = useState(recipientState.city || "");
  const [deliveryRecipient, setDeliveryRecipient] = useState(
    recipientState.deliveryRecipient || joinFullName(
      recipientState.userData || (IS_DEMO_MODE ? DEMO_RECIPIENT_DATA : {})
    )
  );
  const [deliveryComment, setDeliveryComment] = useState(recipientState.deliveryComment || "");
  const [privacyConsent, setPrivacyConsent] = useState(Boolean(recipientState.privacyConsent));
  const [isCdekPickerOpen, setIsCdekPickerOpen] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(() =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width: 639px)").matches
  );

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const query = window.matchMedia("(max-width: 639px)");
    const handleLayoutChange = (event) => setIsMobileLayout(event.matches);
    setIsMobileLayout(query.matches);
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", handleLayoutChange);
      return () => query.removeEventListener("change", handleLayoutChange);
    }
    query.addListener(handleLayoutChange);
    return () => query.removeListener(handleLayoutChange);
  }, []);

  // Оплата / заказы
  const [pickupPoint, setPickupPoint] = useState(
    recipientState.pickupPoint || (IS_DEMO_MODE ? DEMO_PICKUP_POINT : "")
  ); // address.name
  const [deliveryPrice, setDeliveryPrice] = useState(
    recipientState.deliveryPrice ?? (IS_DEMO_MODE ? DEMO_DELIVERY_PRICE : null)
  ); // rate.delivery_sum
  const [manualAddress, setManualAddress] = useState(recipientState.manualAddress || null);
  const [cdekData, setCdekData] = useState(
    recipientState.cdek ||
      (IS_DEMO_MODE
        ? {
            mode: "office",
            tariff: {
              tariff_code: 136,
              tariff_name: "Demo office pickup",
              delivery_sum: DEMO_DELIVERY_PRICE,
              total_sum: DEMO_DELIVERY_PRICE,
              currency: "RUB",
            },
            address: { code: "DEMO-PVZ", address: DEMO_PICKUP_POINT },
            addressLabel: DEMO_PICKUP_POINT,
          }
        : null)
  );
  const [isPaying, setIsPaying] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState("");

  useLayoutEffect(() => {
        // при переходе на шаг получателя всегда показываем верх страницы
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);
  
  // Dadata
  const [isNoCdek, setIsNoCdek] = useState(Boolean(recipientState.isNoCdek));
  const dadataToken = APP_ENV.dadataToken;

  const isManualAddressFull = useMemo(() => {
    return hasFullManualAddress(manualAddress);
  }, [manualAddress]);

  const manualAddressNormalized = useMemo(() => {
    const value = manualAddress?.value || "";
    const house = manualAddress?.data?.house || "";
    const block = manualAddress?.data?.block || "";
    const flat = manualAddress?.data?.flat || "";

    if (!value && !house && !block && !flat) return null;
    return {
      value,
      data: { house, block, flat },
    };
  }, [
    manualAddress?.value,
    manualAddress?.data?.house,
    manualAddress?.data?.block,
    manualAddress?.data?.flat,
  ]);

  const isRecipientSame = useMemo(() => {
    const stored = {
      userData: recipientState.userData,
      pickupPoint: recipientState.pickupPoint,
      deliveryPrice: recipientState.deliveryPrice ?? null,
      manualAddressValue: recipientState.manualAddress?.value || "",
      manualHouse: recipientState.manualAddress?.data?.house || "",
      manualBlock: recipientState.manualAddress?.data?.block || "",
      manualFlat: recipientState.manualAddress?.data?.flat || "",
      isNoCdek: Boolean(recipientState.isNoCdek),
      cdek: recipientState.cdek,
      email: recipientState.email || "",
      preferredContact: recipientState.preferredContact || "",
      orderComment: recipientState.orderComment || "",
      city: recipientState.city || "",
      deliveryRecipient: recipientState.deliveryRecipient || "",
      deliveryComment: recipientState.deliveryComment || "",
      privacyConsent: Boolean(recipientState.privacyConsent),
    };
    const local = {
      userData,
      pickupPoint,
      deliveryPrice: deliveryPrice ?? null,
      manualAddressValue: manualAddress?.value || "",
      manualHouse: manualAddress?.data?.house || "",
      manualBlock: manualAddress?.data?.block || "",
      manualFlat: manualAddress?.data?.flat || "",
      isNoCdek: Boolean(isNoCdek),
      cdek: cdekData,
      email,
      preferredContact,
      orderComment,
      city,
      deliveryRecipient,
      deliveryComment,
      privacyConsent,
    };
    const sameUser =
      (local.userData.firstName || "") === (stored.userData?.firstName || "") &&
      (local.userData.lastName || "") === (stored.userData?.lastName || "") &&
      (local.userData.middleName || "") === (stored.userData?.middleName || "") &&
      (local.userData.phone || "") === (stored.userData?.phone || "");
    return (
      sameUser &&
      local.pickupPoint === stored.pickupPoint &&
      local.deliveryPrice === stored.deliveryPrice &&
      local.manualAddressValue === stored.manualAddressValue &&
      local.manualHouse === stored.manualHouse &&
      local.manualBlock === stored.manualBlock &&
      local.manualFlat === stored.manualFlat &&
      local.isNoCdek === stored.isNoCdek &&
      JSON.stringify(local.cdek ?? null) === JSON.stringify(stored.cdek ?? null) &&
      local.email === stored.email &&
      local.preferredContact === stored.preferredContact &&
      local.orderComment === stored.orderComment &&
      local.city === stored.city &&
      local.deliveryRecipient === stored.deliveryRecipient &&
      local.deliveryComment === stored.deliveryComment &&
      local.privacyConsent === stored.privacyConsent
    );
  }, [
    userData,
    pickupPoint,
    deliveryPrice,
    manualAddress?.value,
    manualAddress?.data?.house,
    manualAddress?.data?.block,
    manualAddress?.data?.flat,
    isNoCdek,
    cdekData,
    email,
    preferredContact,
    orderComment,
    city,
    deliveryRecipient,
    deliveryComment,
    privacyConsent,
    recipientState,
  ]);

  // persist current form values to shared order state so browser Back keeps them
  useEffect(() => {
    if (isRecipientSame) return;
    setRecipient({
      userData,
      pickupPoint,
      deliveryPrice,
      manualAddress: manualAddressNormalized,
      isNoCdek,
      cdek: cdekData,
      email,
      preferredContact,
      orderComment,
      city,
      deliveryRecipient,
      deliveryComment,
      privacyConsent,
    });
  }, [
    userData,
    pickupPoint,
    deliveryPrice,
    manualAddress?.value,
    manualAddress?.data?.house,
    manualAddress?.data?.block,
    manualAddress?.data?.flat,
    manualAddressNormalized,
    isNoCdek,
    cdekData,
    email,
    preferredContact,
    orderComment,
    city,
    deliveryRecipient,
    deliveryComment,
    privacyConsent,
    setRecipient,
    isRecipientSame,
  ]);

  useEffect(() => {
    if (IS_DEMO_MODE) return;
    const hasClothing = Boolean(productType && color && size);
    const hasEmbroidery =
      selectedType === "custom"
        ? (customOption.text
            ? Boolean((customText || "").trim())
            : customOption.image
              ? (uploadedImage?.length || 0) > 0
              : false)
        : Boolean(selectedType && (uploadedImage?.length || 0) > 0);
    if (!hasClothing) {
      navigate("/order", { replace: true });
    } else if (!hasEmbroidery) {
      navigate("/embroidery", { replace: true });
    }
  }, [productType, color, size, selectedType, uploadedImage?.length, customOption.text, customOption.image, customText, navigate]);

  const handleNoCdekToggle = (event) => {
    const checked = event.target.checked;
    setIsNoCdek(checked);

    if (!IS_DEMO_MODE || checked) return;
    setPickupPoint(DEMO_PICKUP_POINT);
    setDeliveryPrice(DEMO_DELIVERY_PRICE);
    setCdekData((prev) => prev || {
      mode: "office",
      tariff: {
        tariff_code: 136,
        tariff_name: "Demo office pickup",
        delivery_sum: DEMO_DELIVERY_PRICE,
        total_sum: DEMO_DELIVERY_PRICE,
        currency: "RUB",
      },
      address: { code: "DEMO-PVZ", address: DEMO_PICKUP_POINT },
      addressLabel: DEMO_PICKUP_POINT,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      const masked = formatPhoneNumber(value);
      setUserData((prev) => ({ ...prev, phone: masked }));
      return;
    }

    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFullNameChange = (event) => {
    const value = event.target.value;
    setDeliveryRecipient((current) => (!current || current === fullNameInput ? value : current));
    setFullNameInput(value);
    setUserData((current) => ({ ...current, ...splitFullName(value) }));
  };

  const cdekOfficeCode = String(
    cdekData?.address?.code || cdekData?.address?.office_code || ""
  ).trim();
  const isCdekPickupSelected = Boolean(
    String(pickupPoint || "").trim() && cdekData?.mode === "office" && cdekOfficeCode
  );
  const recipientValidation = validateRecipient({
    userData,
    isNoCdek,
    manualAddress,
    isCdekPickupSelected,
    privacyConsent,
  });
  const isFormValid = recipientValidation.isValid;
  const getMissingFieldsMessage = () => recipientValidation.message;

  const handleCdekSelect = (payload) => {
    const label =
      payload?.addressLabel ||
      payload?.address?.address ||
      payload?.address?.formatted ||
      payload?.address?.name ||
      "";
    setPickupPoint(label);
    setDeliveryPrice(payload?.tariff?.delivery_sum ?? payload?.tariff?.total_sum ?? null);
    setCdekData(payload || null);
    setIsNoCdek(false);
    setManualAddress(null);
    setCity((current) => current || payload?.address?.city || payload?.address?.location?.city || "");
    setIsCdekPickerOpen(false);
  };

  const applyDemoPickup = () => {
    const goods = [deriveGoodsPreset(productType)];
    const payload = {
      mode: "office",
      tariff: {
        tariff_code: 136,
        tariff_name: "Demo office pickup",
        delivery_sum: DEMO_DELIVERY_PRICE,
        total_sum: DEMO_DELIVERY_PRICE,
        currency: "RUB",
      },
      address: { code: "DEMO-PVZ", address: DEMO_PICKUP_POINT },
      addressLabel: DEMO_PICKUP_POINT,
      goods,
      from: { country_code: "RU", city: "Krasnoyarsk" },
    };

    handleCdekSelect(payload);
  };

  async function createDraftOrder() {
    try {
      const data = await createOrder(buildOrderFormData({
        userData, deliveryRecipient, orderComment, embroideryComment: comment,
        email, preferredContact, deliveryComment, city, privacyConsent,
        productType, color, size, selectedType, embroideryTypeRu,
        patronusCount, petFaceCount, customText, customOption, pickupPoint,
        manualAddress, isNoCdek, cdekData, uploadedImage,
      }));
      setOrderId(data.orderId);
      storeOrderAccessToken(data.orderId, data.orderToken);
      sessionStorage.setItem("pay_order_id", String(data.orderId));
      if (data?.cdekNumber) {
        sessionStorage.setItem("pay_cdek_number", String(data.cdekNumber));
      }
      return data; // { orderId, cdekNumber, ... }
    } catch (err) {
      throw new Error(err.message || 'Create failed');
    }
  }

  async function handlePayment() {
    if (isPaying) return;
    if (!isFormValid) {
      setError(getMissingFieldsMessage());
      return;
    }
    setError('');
    setIsPaying(true);

    if (IS_DEMO_MODE) {
      const now = new Date();
      const demoOrderId = buildDemoOrderId(now);
      const demoCdekNumber = isNoCdek ? null : buildDemoCdekNumber(now);
      setOrderId(demoOrderId);
      sessionStorage.setItem("pay_order_id", demoOrderId);
      if (demoCdekNumber) {
        sessionStorage.setItem("pay_cdek_number", demoCdekNumber);
      } else {
        sessionStorage.removeItem("pay_cdek_number");
      }
      setIsPaying(false);
      navigate("/thank-you", {
        state: {
          orderNumber: demoOrderId,
          manual: isCustomType,
          cdekNumber: demoCdekNumber,
        },
      });
      return;
    }

    try {
      const {
        orderId: oid,
        orderToken,
        cdekNumber: cdekNum,
        pricePending,
      } = await createDraftOrder();
      setOrderId(oid);

      if (pricePending) {
        try {
          await confirmOrder(oid, "manual", orderToken);
        } catch (confirmErr) {
          console.warn("Manual confirm failed:", confirmErr);
        }
        setIsPaying(false);
        navigate("/thank-you", { state: { orderNumber: oid, manual: true, cdekNumber: cdekNum || null } });
        return;
      }

      const paymentUrl = await getPaymentLink(oid, orderToken);
      sessionStorage.setItem('pay_order_id', String(oid));
      sessionStorage.setItem('pay_cdek_number', cdekNum ? String(cdekNum) : "");
      window.location.href = paymentUrl;
    } catch (e) {
      setError(e.message || 'Не удалось создать заказ или перейти к оплате');
      setIsPaying(false);
      }
    }

  useEffect(() => {
    if (IS_DEMO_MODE) return;
    let confirming = false;
    const onMessage = async (event) => {
      if (event.origin !== window.location.origin) return;

      const ok =
        event.data === "payment_success" ||
        (event.data && event.data.type === "payment_status" && event.data.status === "success");
      if (!ok) return;

      if (!orderId) {
        setError("Не удалось определить номер заказа. Попробуйте ещё раз.");
        setIsPaying(false);
        return;
      }

      if (confirming) return;
      confirming = true;

      try {
        const confirmProvider =
          APP_ENV.isDevelopment ? "manual" : "fallback";
        await confirmOrder(orderId, confirmProvider);
        const storedCdek = sessionStorage.getItem("pay_cdek_number") || null;
        navigate('/thank-you', { state: { orderNumber: orderId, cdekNumber: storedCdek || null } });
      } catch (err) {
        const status = err.response?.status;
        const body = err.response?.data;
        console.error('Confirm failed:', status, body);
        setError(body?.message || err.message || 'Подтверждение оплаты не прошло');
      } finally {
        setIsPaying(false);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [orderId, navigate]);

  useEffect(() => {
    if (!isNoCdek) {
      setManualAddress(null);
      return;
    }
    setCdekData(null);
    setPickupPoint("");
    setDeliveryPrice(null);
  }, [isNoCdek]);


  return {
    navigate, productType, isCustomType, fullNameInput, handleFullNameChange, isPaying,
    userData, handleInputChange, email, setEmail, isMobileLayout,
    preferredContact, setPreferredContact, orderComment, setOrderComment,
    city, setCity, isCdekPickerOpen, setIsCdekPickerOpen,
    pickupPoint, setPickupPoint, setDeliveryPrice, isNoCdek,
    isCdekPickupSelected, deliveryRecipient, setDeliveryRecipient,
    deliveryComment, setDeliveryComment, privacyConsent, setPrivacyConsent,
    error, handlePayment, isFormValid, getMissingFieldsMessage,
    handleCdekSelect, applyDemoPickup, handleNoCdekToggle,
    manualAddress, setManualAddress, dadataToken, isManualAddressFull,
  };
};
