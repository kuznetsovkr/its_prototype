import { useState, useEffect, useMemo, useLayoutEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MyCdekWidget from "../components/MyCdekWidget";
import { AddressSuggestions } from 'react-dadata';
import 'react-dadata/dist/react-dadata.css';
import api from '../api';
import { useOrder } from "../context/OrderContext";
import { orderAccessConfig, storeOrderAccessToken } from "../utils/orderAccess";
import { IS_DEMO_MODE } from "../config/demoMode";
import { buildDemoOrderId, buildDemoCdekNumber } from "../mocks/demoData";
import figmaTshirtImg from "../images/order/tshirt-black.png";
import recipientBackIcon from "../images/order/recipient-back.svg";
import orderBackIconTablet from "../images/order/order-back-tablet.svg";
import orderBackIconMobile from "../images/order/order-back-mobile.svg";
import recipientRadioOuter from "../images/order/recipient-radio-outer.svg";
import recipientRadioInner from "../images/order/recipient-radio-inner.svg";
import recipientRadioTablet from "../images/order/recipient-radio-tablet.svg";
import recipientRadioMobile from "../images/order/recipient-radio-mobile.svg";

const EMBROIDERY_TYPE_RU = {
  Patronus: "Патронус",
  Car: "Автомобиль",
  petFace: "Мордочка питомца",
  custom: "Своя вышивка",
};

// ====== ХЕЛПЕРЫ ДЛЯ ТЕЛЕФОНА ======
const cleanPhone = (v) => (v || '').replace(/\D/g, ''); // только цифры
const isRu11 = (digits) => digits.length === 11 && digits.startsWith('7');

// Маска +7 (___) ___-__-__
const formatPhoneNumber = (value) => {
  let numbers = cleanPhone(value);
  if (numbers.startsWith('8')) numbers = `7${numbers.slice(1)}`;
  else if (!numbers.startsWith('7')) numbers = `7${numbers}`;
  numbers = numbers.slice(0, 11);
  return ( 
    '+7 ' +
    (numbers[1] ? `(${numbers.slice(1, 4)}` : '') +
    (numbers[4] ? `) ${numbers.slice(4, 7)}` : '') +
    (numbers[7] ? `-${numbers.slice(7, 9)}` : '') +
    (numbers[9] ? `-${numbers.slice(9, 11)}` : '')
  );
};

const joinFullName = (data = {}) =>
  [data.lastName, data.firstName, data.middleName].filter(Boolean).join(" ");

const splitFullName = (value) => {
  const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
  return {
    lastName: parts[0] || "",
    firstName: parts[1] || "",
    middleName: parts.slice(2).join(" "),
  };
};

const DEMO_RECIPIENT_DATA = {
  firstName: "Ivan",
  lastName: "Ivanov",
  middleName: "Ivanovich",
  phone: "+7 (900) 123-45-67",
};

const DEMO_PICKUP_POINT = "Demo pickup point: Krasnoyarsk, Mira 1";
const DEMO_DELIVERY_PRICE = 390;

const RecipientDetails = () => {
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
  const embroideryPrice = embroidery.price ?? locationState.embroideryPrice ?? 0;
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
            address: { address: DEMO_PICKUP_POINT },
            addressLabel: DEMO_PICKUP_POINT,
          }
        : null)
  );
  const [isPaying, setIsPaying] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState("");

  const totalPrice = useMemo(
    () => (embroideryPrice || 0) + (deliveryPrice || 0),
    [embroideryPrice, deliveryPrice]
  );

  useLayoutEffect(() => {
        // при переходе на шаг получателя всегда показываем верх страницы
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);
  
  // Dadata
  const [isNoCdek, setIsNoCdek] = useState(Boolean(recipientState.isNoCdek));
  const dadataToken = process.env.REACT_APP_DADATA_TOKEN || "";

  const isManualAddressFull = useMemo(() => {
    if (!manualAddress || !manualAddress.data) return false;
    const { house, block, flat } = manualAddress.data || {};
    return Boolean(house || block || flat);
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
      address: { address: DEMO_PICKUP_POINT },
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

  const isUserDataFilled =
    userData.lastName.trim() !== "" &&
    userData.firstName.trim() !== "" &&
    userData.middleName.trim() !== "" &&
    userData.phone.trim() !== "";

  const isDeliveryAddressFilled = isNoCdek ? Boolean(manualAddress?.value && isManualAddressFull) : true;
    
  const isPhoneOk = isRu11(cleanPhone(userData.phone));
  const isFormValid = isUserDataFilled && isDeliveryAddressFilled && isPhoneOk && privacyConsent;

  const getMissingFieldsMessage = () => {
    const missing = [];
    if (!userData.lastName.trim()) missing.push("фамилию");
    if (!userData.firstName.trim()) missing.push("имя");
    if (!userData.middleName.trim()) missing.push("отчество");
    if (!userData.phone.trim()) missing.push("телефон");

    if (isNoCdek) {
      if (!manualAddress?.value || !isManualAddressFull) {
        missing.push("полный адрес до дома");
      }
    }

    if (!isPhoneOk) missing.push("корректный телефон");
    if (!privacyConsent) missing.push("согласие на обработку данных");

    if (missing.length === 0) return "";
    const last = missing.pop();
    const list = missing.length ? `${missing.join(', ')} и ${last}` : last;
    return `Пожалуйста, заполните ${list}`;
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
    setCity((current) => current || payload?.address?.city || payload?.address?.location?.city || "");
    setIsCdekPickerOpen(false);
  };

  const normalizePhoneDigits = (value) => {
    const digits = cleanPhone(value);
    if (!digits) return '';
    if (digits.length === 10) return `7${digits}`;
    if (digits.length === 11 && digits.startsWith('8')) return `7${digits.slice(1)}`;
    return digits;
  };

  const deriveGoodsPreset = () => {
    const name = String(
      typeof productType === "object"
        ? productType?.name || productType?.type || ""
        : productType || ""
    ).toLowerCase();
    const presets = {
      hoodie:   { width: 35, height: 35, length: 7, weight: 0.8 },
      svitshot: { width: 35, height: 35, length: 7, weight: 0.8 },
      tshirt:   { width: 30, height: 20, length: 3, weight: 0.3 },
      default:  { width: 35, height: 35, length: 7, weight: 0.8 },
    };
    const pick = () => {
      if (name.includes('hoodie') || name.includes('hudi')) return presets.hoodie;
      if (name.includes('sweatshirt') || name.includes('svitshot')) return presets.svitshot;
      if (name.includes('t-shirt') || name.includes('tshirt') || name.includes('tee')) return presets.tshirt;
      return presets.default;
    };
    const base = pick();
    return { ...base, weight_grams: Math.round((base.weight || 0) * 1000) };
  };

  const applyDemoPickup = () => {
    const goods = [deriveGoodsPreset()];
    const payload = {
      mode: "office",
      tariff: {
        tariff_code: 136,
        tariff_name: "Demo office pickup",
        delivery_sum: DEMO_DELIVERY_PRICE,
        total_sum: DEMO_DELIVERY_PRICE,
        currency: "RUB",
      },
      address: { address: DEMO_PICKUP_POINT },
      addressLabel: DEMO_PICKUP_POINT,
      goods,
      from: { country_code: "RU", city: "Krasnoyarsk" },
    };

    handleCdekSelect(payload);
  };

  async function createDraftOrder() {
    const fd = new FormData();
    const recipientFullName = deliveryRecipient.trim() || joinFullName(userData);
    const primaryOrderComment = orderComment.trim() || String(comment || "").trim();
    const formComment = [
      primaryOrderComment,
      email.trim() ? `E-mail: ${email.trim()}` : "",
      preferredContact.trim() ? `Удобный способ связи: ${preferredContact.trim()}` : "",
      deliveryComment.trim() ? `Комментарий к доставке: ${deliveryComment.trim()}` : "",
    ].filter(Boolean).join("\n");

    fd.append("firstName", userData.firstName || "");
    fd.append("lastName", userData.lastName || "");
    fd.append("middleName", userData.middleName || "");
    fd.append("phone", userData.phone || "");
    fd.append("recipientPhoneDigits", normalizePhoneDigits(userData.phone) || "");
    fd.append("recipientFullName", recipientFullName);
    fd.append("email", email.trim());
    fd.append("preferredContact", preferredContact.trim());
    fd.append("deliveryComment", deliveryComment.trim());
    fd.append("deliveryCity", city.trim());
    fd.append("privacyConsent", String(privacyConsent));

    const productTypeName =
      typeof productType === "object"
        ? (productType.name ?? productType.type ?? String(productType))
        : productType;

    fd.append("productType", productTypeName);
    fd.append("color", color || "");
    fd.append("size", size || "");

    fd.append("embroideryType", selectedType || "");
    fd.append("embroideryTypeRu", embroideryTypeRu);
    fd.append("patronusCount", String(patronusCount || 0));
    fd.append("petFaceCount", String(petFaceCount || 0));
    fd.append("customText", customText || "");
    fd.append("customOption", JSON.stringify(customOption || {}));
    fd.append("comment", formComment);

    fd.append("deliveryAddress", pickupPoint || (manualAddress && manualAddress.value) || "");
    fd.append("totalPrice", String(totalPrice || 0));

    const deliveryPayment = { payer: "sender", paidByUserOnSite: true };
    if (!isNoCdek && cdekData) {
      const goods = (cdekData.goods && cdekData.goods.length) ? cdekData.goods : [deriveGoodsPreset()];
      fd.append("cdekMode", cdekData.mode || "");
      fd.append("cdekTariffCode", cdekData.tariff?.tariff_code || "");
      fd.append("cdekTariff", JSON.stringify(cdekData.tariff || {}));
      fd.append("cdekAddress", JSON.stringify(cdekData.address || {}));
      fd.append("cdekAddressLabel", cdekData.addressLabel || "");
      fd.append("cdekGoods", JSON.stringify(goods));
      fd.append("cdekFrom", JSON.stringify(cdekData.from || {}));
      fd.append("deliveryPayment", JSON.stringify(deliveryPayment));
    }

    (uploadedImage || []).forEach((file, idx) => {
      if (file) fd.append("images", file, file.name || `image_${idx}.jpg`);
    });

    try {
      const { data } = await api.post('/orders/create', fd);
      if (!data?.orderId || !data?.orderToken) {
        throw new Error("Сервер не вернул данные доступа к заказу");
      }
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
      const { orderId: oid, orderToken, cdekNumber: cdekNum } = await createDraftOrder();
      setOrderId(oid);

      if (isCustomType) {
        try {
          await api.post(
            `/orders/confirm/${encodeURIComponent(oid)}`,
            { provider: "manual" },
            orderAccessConfig(oid, orderToken)
          );
        } catch (confirmErr) {
          console.warn("Manual confirm failed:", confirmErr);
        }
        setIsPaying(false);
        navigate("/thank-you", { state: { orderNumber: oid, manual: true, cdekNumber: cdekNum || null } });
        return;
      }

      const { data } = await api.post(
        '/payments/paykeeper/link',
        { orderId: oid },
        orderAccessConfig(oid, orderToken)
      );
      sessionStorage.setItem('pay_order_id', String(oid));
      sessionStorage.setItem('pay_cdek_number', cdekNum ? String(cdekNum) : "");
      window.location.href = data.pay_url;
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
          process.env.NODE_ENV === "development" ? "manual" : "fallback";
        await api.post(
          `/orders/confirm/${encodeURIComponent(orderId)}`,
          { provider: confirmProvider },
          orderAccessConfig(orderId)
        );
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


  return (
    <>
      <section className="recipientOrderPage" aria-labelledby="recipient-order-title">
        <div className="recipientOrderPage__stage">
          <div className="recipientOrderCard">
            <div className="recipientOrderCard__preview">
              <button
                type="button"
                className="recipientOrderCard__backArrow"
                onClick={() => navigate(-1)}
                aria-label="Вернуться назад"
              >
                <picture className="recipientOrderCard__backIcon">
                  <source media="(max-width: 639px)" srcSet={orderBackIconMobile} />
                  <source media="(max-width: 1279px)" srcSet={orderBackIconTablet} />
                  <img src={recipientBackIcon} alt="" aria-hidden="true" />
                </picture>
              </button>

              <h1 className="recipientOrderCard__title" id="recipient-order-title">
                заказ изделия
              </h1>

              <div className="recipientOrderCard__imageFrame">
                <img src={figmaTshirtImg} alt="Чёрная футболка" />
              </div>
            </div>

            <div className="recipientOrderCard__controls">
              <div className="recipientOrderForm">
                <h2 className="recipientOrderForm__heading recipientOrderForm__heading--personal">
                  Введите свои данные
                </h2>

                <input
                  className="recipientOrderForm__field recipientOrderForm__field--fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="ФИО"
                  value={fullNameInput}
                  onChange={handleFullNameChange}
                  disabled={isPaying}
                />

                <div className="recipientOrderForm__phoneField">
                  <input
                    className="recipientOrderForm__field recipientOrderForm__field--phone"
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    placeholder="Номер телефона"
                    value={userData.phone}
                    onChange={handleInputChange}
                    disabled={isPaying}
                    maxLength={18}
                  />
                </div>

                <input
                  className="recipientOrderForm__field recipientOrderForm__field--email"
                  type="email"
                  autoComplete="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isPaying}
                />

                <input
                  className="recipientOrderForm__field recipientOrderForm__field--contact"
                  type="text"
                  placeholder={isMobileLayout ? "Удобный способ связи" : "Удобный способ связи ( Telegram / VK / другое )"}
                  value={preferredContact}
                  onChange={(event) => setPreferredContact(event.target.value)}
                  disabled={isPaying}
                />

                <textarea
                  className="recipientOrderForm__field recipientOrderForm__field--orderComment"
                  placeholder="Комментарий / пожелание к заказу"
                  value={orderComment}
                  onChange={(event) => setOrderComment(event.target.value)}
                  disabled={isPaying}
                />

                <h2 className="recipientOrderForm__heading recipientOrderForm__heading--delivery">
                  Доставка
                </h2>

                <label className="recipientOrderForm__group recipientOrderForm__group--city">
                  <span>Город</span>
                  <input
                    type="text"
                    placeholder={isMobileLayout ? "Санкт - Петербург" : "Санкт-Петербург"}
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    disabled={isPaying}
                  />
                </label>

                <button
                  type="button"
                  className="recipientOrderForm__deliveryMethod"
                  onClick={() => setIsCdekPickerOpen(true)}
                >
                  <span className="recipientOrderForm__radio" aria-hidden="true">
                    <picture className="recipientOrderForm__radioResponsive">
                      <source media="(max-width: 639px)" srcSet={recipientRadioMobile} />
                      <img src={recipientRadioTablet} alt="" />
                    </picture>
                    <img className="recipientOrderForm__radioOuter" src={recipientRadioOuter} alt="" />
                    <img className="recipientOrderForm__radioInner" src={recipientRadioInner} alt="" />
                  </span>
                  <span className="recipientOrderForm__deliveryMethodText">
                    <strong>СДЭК — </strong>
                    Доставка до пункта выдачи заказов <span>от 4 дней, от 450 р</span>
                  </span>
                </button>

                <label className="recipientOrderForm__group recipientOrderForm__group--pickup">
                  <span>Пункт получения</span>
                  <button type="button" onClick={() => setIsCdekPickerOpen(true)}>
                    {pickupPoint || "Выберите пункт получения"}
                  </button>
                </label>

                <label className="recipientOrderForm__group recipientOrderForm__group--recipient">
                  <span>Получатель (ФИО полностью)</span>
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder="Иванов Иван Иванович"
                    value={deliveryRecipient}
                    onChange={(event) => setDeliveryRecipient(event.target.value)}
                    disabled={isPaying}
                  />
                </label>

                <label className="recipientOrderForm__group recipientOrderForm__group--deliveryComment">
                  <span>Комментарий</span>
                  <input
                    type="text"
                    placeholder="Комментарий к доставке"
                    value={deliveryComment}
                    onChange={(event) => setDeliveryComment(event.target.value)}
                    disabled={isPaying}
                  />
                </label>

                <label className="recipientOrderForm__consent">
                  <input
                    type="checkbox"
                    checked={privacyConsent}
                    onChange={(event) => setPrivacyConsent(event.target.checked)}
                  />
                  <span>
                    Я даю <em>своё согласие на обработку моих персональных данных</em> в соответствии с <em>политикой конфиденциальности</em>
                  </span>
                </label>
              </div>

              {error && <p className="recipientOrderCard__error" role="alert">{error}</p>}

              <div className="recipientOrderNavigation">
                <button type="button" className="recipientOrderNavigation__back" onClick={() => navigate(-1)}>
                  назад
                </button>
                <button
                  type="button"
                  className="recipientOrderNavigation__submit"
                  onClick={handlePayment}
                  disabled={!isFormValid || isPaying}
                  title={!isFormValid ? getMissingFieldsMessage() : undefined}
                >
                  {isPaying ? "Обрабатываем..." : isCustomType ? "отправить заявку" : (
                    <>
                      <span className="recipientOrderNavigation__paymentLabel">к оплате</span>
                      <span className="recipientOrderNavigation__tabletLabel">далее</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div
        className={`recipientCdekDialog${isCdekPickerOpen ? " is-open" : ""}`}
        aria-hidden={!isCdekPickerOpen}
      >
        <button
          type="button"
          className="recipientCdekDialog__backdrop"
          onClick={() => setIsCdekPickerOpen(false)}
          aria-label="Закрыть выбор пункта получения"
        />
        <section className="recipientCdekDialog__surface" role="dialog" aria-modal="true" aria-label="Выбор пункта СДЭК">
          <div className="recipientCdekDialog__header">
            <h2>Выберите пункт получения</h2>
            <button type="button" onClick={() => setIsCdekPickerOpen(false)} aria-label="Закрыть">×</button>
          </div>

          <div className="blockCDEK recipientCdekDialog__content">
            <div className="mapBox">
              <div id="cdek-map">
                {IS_DEMO_MODE && (
                  <div className="cdek-map__demo">
                    <p className="cdek-map__demo-title">CDEK map placeholder (demo mode)</p>
                    <p className="cdek-map__demo-text">Use the button below to emulate pickup-point selection.</p>
                  </div>
                )}
              </div>
            </div>
            {!IS_DEMO_MODE && (
              <MyCdekWidget
                productType={productType}
                onAddressSelect={setPickupPoint}
                onRateSelect={setDeliveryPrice}
                onCdekSelect={handleCdekSelect}
              />
            )}
            {IS_DEMO_MODE && !isNoCdek && (
              <button type="button" className="demoPickupButton" onClick={applyDemoPickup}>
                Select demo pickup point
              </button>
            )}
            <label className="recipientCdekDialog__manualToggle">
              <input type="checkbox" checked={isNoCdek} onChange={handleNoCdekToggle} />
              В моём городе нет СДЭКа
            </label>
            {isNoCdek && (
              <div className="manualAddress">
                {IS_DEMO_MODE ? (
                  <input
                    type="text"
                    className="manualAddress__input"
                    placeholder="Введите адрес доставки"
                    value={manualAddress?.value || ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      setManualAddress({
                        value,
                        data: { house: value.trim() ? "1" : "", block: "", flat: "" },
                      });
                    }}
                  />
                ) : (
                  <AddressSuggestions
                    token={dadataToken}
                    value={manualAddress}
                    onChange={setManualAddress}
                    inputProps={{ placeholder: "Введите свой адрес" }}
                  />
                )}
                {!IS_DEMO_MODE && !isManualAddressFull && (
                  <p className="manualAddress__hint">Пожалуйста, выберите подсказку с указанием дома.</p>
                )}
                {manualAddress?.value && (
                  <p className="manualAddress__selected">Вы выбрали: {manualAddress.value}</p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default RecipientDetails;
