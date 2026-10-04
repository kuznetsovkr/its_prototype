import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IS_DEMO_MODE, IS_TURNSTILE_E2E } from "../../../config/demoMode";
import { MEDIA_QUERIES } from "../../../config/breakpoints";
import { APP_ENV } from "../../../config/env";
import { useOrder } from "../../../context/OrderContext";
import { buildDemoCdekNumber, buildDemoOrderId } from "../../../mocks/demoData";
import { getEmbroideryCountError, getPatronusLimit } from "../embroidery/embroideryLimits";
import { getOrderAccessToken, storeOrderAccessToken } from "../../../utils/orderAccess";
import {
  confirmOrder,
  completeCertificateOrder,
  createOrder,
  getCheckoutQuote,
  getPaymentLink,
} from "./recipientApi";
import { buildOrderFormData } from "./recipientOrderPayload";
import { useTurnstileChallenge } from "./useTurnstileChallenge";
import { useOrderCertificate } from "./useOrderCertificate";
import {
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
  const isCertificateAvailable = !IS_DEMO_MODE || IS_TURNSTILE_E2E;
  const certificate = useOrderCertificate(isCertificateAvailable ? recipientState.certificateCode : "", setRecipient);
  const locationState = location.state || {};

  const productType = clothing.type || locationState.productType;
  const color = clothing.color || locationState.color;
  const size = clothing.size || locationState.size;

  const selectedType = embroidery.type || locationState.selectedType;
  const isCustomType = selectedType === "custom";
  const customText = embroidery.customText || locationState.customText;
  const customTextFont = embroidery.customTextFont || locationState.customTextFont || "Arial";
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
  const [hasNoMiddleName, setHasNoMiddleName] = useState(
    Boolean(recipientState.hasNoMiddleName)
  );
  const [email, setEmail] = useState(recipientState.email || "");
  const [preferredContact, setPreferredContact] = useState(recipientState.preferredContact || "");
  const [orderComment, setOrderComment] = useState(recipientState.orderComment || comment || "");
  const [deliveryRecipient, setDeliveryRecipient] = useState(
    recipientState.deliveryRecipient && (
      recipientState.recipientPhone ||
      recipientState.deliveryRecipient !== joinFullName(recipientState.userData)
    ) ? recipientState.deliveryRecipient : ""
  );
  const [recipientPhone, setRecipientPhone] = useState(recipientState.recipientPhone || "");
  const [deliveryComment, setDeliveryComment] = useState(recipientState.deliveryComment || "");
  const [privacyConsent, setPrivacyConsent] = useState(Boolean(recipientState.privacyConsent));
  const [isCdekPickerOpen, setIsCdekPickerOpen] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(() =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(MEDIA_QUERIES.mobile).matches
  );

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const query = window.matchMedia(MEDIA_QUERIES.mobile);
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
  const [draftOrder, setDraftOrder] = useState(() => {
    if (!isCertificateAvailable) return null;
    const saved = recipientState.savedOrder;
    return saved?.orderId && saved?.orderToken === getOrderAccessToken(saved.orderId) ? saved : null;
  });
  const [orderId, setOrderId] = useState(draftOrder?.orderId || null);
  const [checkoutQuote, setCheckoutQuote] = useState(null);
  const [checkoutQuoteLoading, setCheckoutQuoteLoading] = useState(false);
  const [checkoutQuoteError, setCheckoutQuoteError] = useState("");
  const [error, setError] = useState("");
  const turnstile = useTurnstileChallenge({
    disabled: IS_DEMO_MODE && !IS_TURNSTILE_E2E,
  });

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
      hasNoMiddleName: Boolean(recipientState.hasNoMiddleName),
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
      deliveryRecipient: recipientState.deliveryRecipient || "",
      recipientPhone: recipientState.recipientPhone || "",
      deliveryComment: recipientState.deliveryComment || "",
      privacyConsent: Boolean(recipientState.privacyConsent),
    };
    const local = {
      userData,
      hasNoMiddleName,
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
      deliveryRecipient,
      recipientPhone,
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
      local.hasNoMiddleName === stored.hasNoMiddleName &&
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
      local.deliveryRecipient === stored.deliveryRecipient &&
      local.recipientPhone === stored.recipientPhone &&
      local.deliveryComment === stored.deliveryComment &&
      local.privacyConsent === stored.privacyConsent
    );
  }, [
    userData,
    hasNoMiddleName,
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
    deliveryRecipient,
    recipientPhone,
    deliveryComment,
    privacyConsent,
    recipientState,
  ]);

  // persist current form values to shared order state so browser Back keeps them
  useEffect(() => {
    if (isRecipientSame) return;
    setRecipient({
      userData,
      hasNoMiddleName,
      pickupPoint,
      deliveryPrice,
      manualAddress: manualAddressNormalized,
      isNoCdek,
      cdek: cdekData,
      email,
      preferredContact,
      orderComment,
      deliveryRecipient,
      recipientPhone,
      deliveryComment,
      privacyConsent,
    });
  }, [
    userData,
    hasNoMiddleName,
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
    deliveryRecipient,
    recipientPhone,
    deliveryComment,
    privacyConsent,
    setRecipient,
    isRecipientSame,
  ]);

  useEffect(() => {
    if (IS_DEMO_MODE || draftOrder) return;
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
  }, [productType, color, size, selectedType, uploadedImage?.length, customOption.text, customOption.image, customText, navigate, draftOrder]);

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

  const handleRecipientPhoneChange = (event) => {
    const value = event.target.value;
    setRecipientPhone(/\d/.test(value) ? formatPhoneNumber(value) : "");
  };

  const handleFullNameChange = (event) => {
    const value = event.target.value;
    const parsedName = splitFullName(value);
    if (hasNoMiddleName && parsedName.middleName) {
      setHasNoMiddleName(false);
    }
    setFullNameInput(value);
    setUserData((current) => ({ ...current, ...parsedName }));
  };

  const handleNoMiddleNameToggle = (event) => {
    const checked = event.target.checked;
    setHasNoMiddleName(checked);
    if (!checked) return;

    const nextUserData = { ...userData, middleName: "" };
    const nextFullName = joinFullName(nextUserData);
    setUserData(nextUserData);
    setFullNameInput(nextFullName);
  };

  const cdekOfficeCode = String(
    cdekData?.address?.code || cdekData?.address?.office_code || ""
  ).trim();
  const isCdekPickupSelected = Boolean(
    String(pickupPoint || "").trim() && cdekData?.mode === "office" && cdekOfficeCode
  );
  const isManualCheckout = isCustomType || isNoCdek;

  useEffect(() => {
    if (draftOrder) {
      setCheckoutQuote(draftOrder);
      setCheckoutQuoteLoading(false);
      setCheckoutQuoteError("");
      return undefined;
    }
    if (isManualCheckout) {
      setCheckoutQuote({ manual: true, merchandisePrice: null, deliveryPrice: null, totalPrice: null });
      setCheckoutQuoteLoading(false);
      setCheckoutQuoteError("");
      return undefined;
    }
    if (!productType || !color || !size || !selectedType || !isCdekPickupSelected) {
      setCheckoutQuote(null);
      setCheckoutQuoteLoading(false);
      setCheckoutQuoteError("");
      return undefined;
    }

    if (IS_DEMO_MODE && (!IS_TURNSTILE_E2E || !certificate.appliedCode)) {
      const merchandisePrice = Number(embroidery.price);
      const normalizedDeliveryPrice = Number(deliveryPrice);
      const hasDemoPrice = Number.isFinite(merchandisePrice) && Number.isFinite(normalizedDeliveryPrice);
      setCheckoutQuote(hasDemoPrice ? {
        manual: false,
        merchandisePrice,
        deliveryPrice: normalizedDeliveryPrice,
        totalPrice: merchandisePrice + normalizedDeliveryPrice,
      } : null);
      setCheckoutQuoteLoading(false);
      setCheckoutQuoteError(hasDemoPrice ? "" : "Не удалось рассчитать итоговую стоимость");
      return undefined;
    }

    let cancelled = false;
    setCheckoutQuote(null);
    setCheckoutQuoteLoading(true);
    setCheckoutQuoteError("");
    getCheckoutQuote({
      productType: typeof productType === "object"
        ? productType.name || productType.type || String(productType)
        : productType,
      color,
      size,
      embroideryType: selectedType,
      patronusCount,
      petFaceCount,
      cdekMode: "office",
      cdekAddress: { code: cdekOfficeCode },
      ...(certificate.appliedCode ? { certificateCode: certificate.appliedCode } : {}),
    }).then((quote) => {
      if (!cancelled) setCheckoutQuote(quote);
    }).catch((quoteError) => {
      if (!cancelled) {
        setCheckoutQuoteError(quoteError.message || "Не удалось рассчитать итоговую стоимость");
      }
    }).finally(() => {
      if (!cancelled) setCheckoutQuoteLoading(false);
    });
    return () => { cancelled = true; };
  }, [
    isManualCheckout,
    productType,
    color,
    size,
    selectedType,
    isCdekPickupSelected,
    cdekOfficeCode,
    patronusCount,
    petFaceCount,
    deliveryPrice,
    embroidery.price,
    certificate.appliedCode,
    draftOrder,
  ]);

  const recipientValidation = validateRecipient({
    userData,
    deliveryRecipient,
    recipientPhone,
    hasNoMiddleName,
    isNoCdek,
    manualAddress,
    isCdekPickupSelected,
    privacyConsent,
  });
  const embroideryCountError = getEmbroideryCountError({
    type: selectedType,
    patronusCount,
    petFaceCount,
    patronusLimit: getPatronusLimit(clothing.profile),
  });
  const isFormValid = recipientValidation.isValid;
  const getMissingFieldsMessage = () => recipientValidation.message;
  const hasCheckoutTotal = checkoutQuote?.totalPrice != null && Number.isFinite(Number(checkoutQuote.totalPrice));
  const canSubmit = isFormValid && Boolean(selectedType) && !embroideryCountError &&
    !certificate.hasUnappliedCode && !certificate.error && !(isManualCheckout && certificate.appliedCode) &&
    (isManualCheckout || (!checkoutQuoteLoading && !checkoutQuoteError && hasCheckoutTotal)) &&
    (Boolean(draftOrder) || turnstile.isSatisfied);
  const getSubmitDisabledMessage = () => {
    if (certificate.error) return certificate.error;
    if (certificate.hasUnappliedCode) return "Примените или удалите код сертификата";
    if (isManualCheckout && certificate.appliedCode) return "Сертификат можно применить после расчёта стоимости менеджером. Удалите код, чтобы отправить заявку";
    if (!selectedType) return "Выберите тип вышивки";
    if (!isFormValid) return getMissingFieldsMessage();
    if (embroideryCountError) return embroideryCountError;
    if (checkoutQuoteLoading) return "Дождитесь итогового расчёта стоимости";
    if (checkoutQuoteError) return checkoutQuoteError;
    if (!isManualCheckout && !hasCheckoutTotal) return "Не удалось рассчитать итоговую стоимость";
    if (turnstile.status === "loading") return "Дождитесь загрузки проверки защиты";
    if (turnstile.status === "error") return "Не удалось загрузить проверку защиты";
    if (!draftOrder && !turnstile.isSatisfied) return "Подтвердите, что заказ отправляет человек";
    return "";
  };

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
    setIsCdekPickerOpen(false);
  };

  const applyDemoPickup = () => {
    const packageProfile = clothing.profile?.package || {};
    const packageWeight = Number(packageProfile.weight || 0);
    const goods = [{
      width: Number(packageProfile.width || 0),
      height: Number(packageProfile.height || 0),
      length: Number(packageProfile.length || 0),
      weight: packageWeight / 1000,
      weight_grams: packageWeight,
    }];
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
    if (draftOrder?.orderId && draftOrder?.orderToken) return draftOrder;
    try {
      const data = await createOrder(buildOrderFormData({
        userData, deliveryRecipient, recipientPhone, orderComment, embroideryComment: comment,
        email, preferredContact, deliveryComment, privacyConsent,
        productType, color, size, selectedType, embroideryTypeRu,
        patronusCount, petFaceCount, customText, customTextFont, customOption, pickupPoint,
        manualAddress, isNoCdek, cdekData, uploadedImage, turnstileToken: turnstile.token,
        certificateCode: certificate.appliedCode,
      }));
      setOrderId(data.orderId);
      setDraftOrder(data);
      storeOrderAccessToken(data.orderId, data.orderToken);
      setRecipient({ savedOrder: data });
      sessionStorage.setItem("pay_order_id", String(data.orderId));
      sessionStorage.removeItem("pay_cdek_number");
      if (data?.cdekNumber) {
        sessionStorage.setItem("pay_cdek_number", String(data.cdekNumber));
      }
      return data; // { orderId, cdekNumber, ... }
    } catch (err) {
      turnstile.reset();
      throw new Error(err.message || 'Create failed');
    }
  }

  async function handlePayment() {
    if (isPaying) return;
    if (!canSubmit) {
      setError(getSubmitDisabledMessage());
      return;
    }
    setError('');
    setIsPaying(true);

    if (IS_DEMO_MODE && (!IS_TURNSTILE_E2E || (!certificate.appliedCode && !draftOrder))) {
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
          manual: isManualCheckout,
          cdekNumber: demoCdekNumber,
        },
      });
      return;
    }

    let activeDraft = draftOrder;

    try {
      activeDraft = await createDraftOrder();
      const {
        orderId: oid,
        orderToken,
        cdekNumber: cdekNum,
        pricePending,
        merchandisePrice,
        deliveryPrice: confirmedDeliveryPrice,
        totalPrice,
        paymentAmount,
        paymentTestMode,
        certificateDiscount, amountDue, requiresBankPayment,
      } = activeDraft;
      setOrderId(oid);

      if (Number.isFinite(Number(totalPrice))) {
        setCheckoutQuote({
          manual: false,
          merchandisePrice,
          deliveryPrice: confirmedDeliveryPrice,
          totalPrice,
          paymentAmount,
          paymentTestMode,
          certificateDiscount, amountDue, requiresBankPayment,
        });
      }

      if (pricePending) {
        await confirmOrder(oid, "manual", orderToken);
        setIsPaying(false);
        navigate("/thank-you", { state: { orderNumber: oid, manual: true, cdekNumber: cdekNum || null } });
        return;
      }

      if (requiresBankPayment === false && amountDue === 0) {
        await completeCertificateOrder(oid, orderToken);
        setIsPaying(false);
        navigate("/thank-you", { state: { orderNumber: oid, cdekNumber: cdekNum || null } });
        return;
      }

      const paymentUrl = await getPaymentLink(oid, orderToken || getOrderAccessToken(oid));
      sessionStorage.setItem('pay_order_id', String(oid));
      sessionStorage.setItem('pay_cdek_number', cdekNum ? String(cdekNum) : "");
      window.location.href = paymentUrl;
    } catch (e) {
      setError(
        `${e.message || "Не удалось создать заказ или перейти к оплате"}` +
        (activeDraft?.orderId ? ". Заказ уже сохранён — повторите оплату." : "")
      );
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
    navigate, productType, clothingProfile: clothing.profile, isCustomType,
    clothingPreviewSrc: clothing.previewSrc || "",
    clothingPreviewAlt: clothing.previewAlt || clothing.type || "Одежда",
    fullNameInput, handleFullNameChange, isPaying,
    hasNoMiddleName, handleNoMiddleNameToggle,
    userData, handleInputChange, email, setEmail, isMobileLayout,
    preferredContact, setPreferredContact, orderComment, setOrderComment,
    isCdekPickerOpen, setIsCdekPickerOpen,
    pickupPoint, setPickupPoint, setDeliveryPrice, isNoCdek,
    isCdekPickupSelected, deliveryRecipient, setDeliveryRecipient, recipientPhone, handleRecipientPhoneChange,
    deliveryComment, setDeliveryComment, privacyConsent, setPrivacyConsent,
    error, handlePayment, isFormValid, canSubmit, getMissingFieldsMessage,
    getSubmitDisabledMessage, checkoutQuote, checkoutQuoteLoading, checkoutQuoteError,
    isManualCheckout, isCheckoutLocked: Boolean(draftOrder),
    handleCdekSelect, applyDemoPickup, handleNoCdekToggle,
    manualAddress, setManualAddress, dadataToken, isManualAddressFull,
    turnstile,
    certificate,
    isCertificateAvailable,
  };
};
