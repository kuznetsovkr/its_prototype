import { useState, useEffect, useMemo, useLayoutEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MyCdekWidget from "../components/MyCdekWidget";
import { AddressSuggestions } from 'react-dadata';
import 'react-dadata/dist/react-dadata.css';
import api from '../api';
import { useOrder } from "../context/OrderContext";
import { applyAuthResponse, resolveUserRole } from "../utils/auth";

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
  if (!numbers.startsWith('7')) numbers = '7' + numbers; // принудительно 7 в начале
  return ( 
    '+7 ' +
    (numbers[1] ? `(${numbers.slice(1, 4)}` : '') +
    (numbers[4] ? `) ${numbers.slice(4, 7)}` : '') +
    (numbers[7] ? `-${numbers.slice(7, 9)}` : '') +
    (numbers[9] ? `-${numbers.slice(9, 11)}` : '')
  );
};

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

  const [userData, setUserData] = useState(
    recipientState.userData || { firstName: "", lastName: "", middleName: "", phone: "" }
  );

  // Телефон/аутентификация
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(!!localStorage.getItem("token"));
  const [phoneFromProfile, setPhoneFromProfile] = useState(false);   // телефон подтянулся из профиля
  const [phoneLocked, setPhoneLocked] = useState(false);             // поле зафиксировано (нельзя редачить)
  const [phoneVerified, setPhoneVerified] = useState(false);         // подтверждён (✓) или считается валидным, если из профиля и не редактируется
  const [phoneEditedSinceProfile, setPhoneEditedSinceProfile] = useState(false); // меняли после «изменить»
  // Шаги подтверждения
  const [smsRequested, setSmsRequested] = useState(false);
  const [smsStep, setSmsStep] = useState(0); // 0 - ничего, 1 - ввод кода, 2 - ввод пароля админа
  const [smsCode, setSmsCode] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [resendTimer, setResendTimer] = useState(0); // сек до повторной отправки
  const [authError, setAuthError] = useState("");

  // Оплата / заказы
  const [pickupPoint, setPickupPoint] = useState(recipientState.pickupPoint || ""); // address.name
  const [deliveryPrice, setDeliveryPrice] = useState(
    recipientState.deliveryPrice ?? null
  ); // rate.delivery_sum
  const [manualAddress, setManualAddress] = useState(recipientState.manualAddress || null);
  const [cdekData, setCdekData] = useState(recipientState.cdek || null);
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
  const dadataToken = "0821b30c8abbf80ea31555ae120fed168b30b8dc"; // ваш токен

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
      JSON.stringify(local.cdek ?? null) === JSON.stringify(stored.cdek ?? null)
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
    setRecipient,
    isRecipientSame,
  ]);

  useEffect(() => {
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
    setIsNoCdek(event.target.checked);
  };


  useEffect(() => {
    const fetchUserData = async () => {
      if (!isUserAuthenticated) return;
      try {
        const { data } = await api.get('/user/me');
        const maskedPhone = data?.phone ? formatPhoneNumber(String(data.phone)) : "";
        const role = resolveUserRole(data);
        if (role) localStorage.setItem("role", role);
        setUserData({
          firstName: data?.firstName ?? "",
          lastName: data?.lastName ?? "",
          middleName: data?.middleName ?? "",
          phone: maskedPhone,
        });

        const hasProfilePhone = Boolean(data?.phone);
        setPhoneFromProfile(hasProfilePhone);
        setPhoneLocked(hasProfilePhone);
        setPhoneVerified(hasProfilePhone); 
        setPhoneEditedSinceProfile(false);
      } catch (e) {
        console.error("Ошибка получения данных пользователя:", e);
      }
    };
    fetchUserData();
  }, [isUserAuthenticated]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      const masked = formatPhoneNumber(value);
      setUserData((prev) => ({ ...prev, phone: masked }));
      setAuthError("");
      if (phoneFromProfile) {
        setPhoneEditedSinceProfile(true);
        setPhoneVerified(false); 
      }
      return;
    }

    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const isUserDataFilled =
    userData.lastName.trim() !== "" &&
    userData.firstName.trim() !== "" &&
    userData.middleName.trim() !== "" &&
    userData.phone.trim() !== "";

  const isDeliveryAddressFilled = isNoCdek ? Boolean(manualAddress?.value && isManualAddressFull) : Boolean(pickupPoint);
    
  const isPhoneOk = phoneVerified || (phoneFromProfile && phoneLocked && !phoneEditedSinceProfile);
  const isFormValid = isUserDataFilled && isDeliveryAddressFilled && isPhoneOk;

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
    } else {
      if (!pickupPoint) missing.push("пункт выдачи СДЭК");
    }

    if (!isPhoneOk) missing.push("подтвердите телефон");

    if (missing.length === 0) return "";
    const last = missing.pop();
    const list = missing.length ? `${missing.join(', ')} и ${last}` : last;
    return `Пожалуйста, заполните ${list}`;
  };


  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  const validatePhoneMasked = () => {
    const digits = cleanPhone(userData.phone);
    if (!isRu11(digits)) {
      setAuthError("Введите корректный номер телефона.");
      return null;
    }
    return digits;
  };

  const requestSms = async () => {
    setAuthError("");
    const digits = validatePhoneMasked();
    if (!digits) return;

    try {
      const response = await api.post('/auth/request-sms', { phone: digits });
      if (response.data?.message === "Введите пароль") {
        setSmsStep(2);
      } else {
        setSmsStep(1);
      }
      setSmsRequested(true);
      setResendTimer(60);
      const debugCode = response.data?.debugCode;
      if (debugCode) {
        alert(`Тестовый СМС-код: ${debugCode}`);
      }
    } catch (err) {
      console.error("Ошибка при запросе SMS:", err);
      setAuthError("Ошибка при отправке SMS, попробуйте снова.");
    }
  };

  const resendSms = async () => {
    if (resendTimer > 0) return;
    await requestSms();
  };

  const confirmSmsCode = async () => {
    setAuthError("");
    const digits = validatePhoneMasked();
    if (!digits) return;
    if (!smsCode || smsCode.length < 4) {
      setAuthError("Введите корректный код из SMS.");
      return;
    }
    try {
      const response = await api.post('/auth/login', { phone: digits, smsCode });
      await applyAuthResponse(response.data);
      setIsUserAuthenticated(true);
      setPhoneVerified(true);
      setPhoneLocked(true);
      setSmsRequested(false);
      setSmsStep(0);
      setSmsCode("");
      setAdminPassword("");
      setPhoneEditedSinceProfile(false);
    } catch (err) {
      console.error("Ошибка при авторизации:", err);
      setAuthError("Неверный код, попробуйте снова.");
    }
  };

  const confirmAdminPassword = async () => {
    setAuthError("");
    const digits = validatePhoneMasked();
    if (!digits) return;
    if (!adminPassword) {
      setAuthError("Введите пароль.");
      return;
    }
    try {
      const response = await api.post('/auth/admin-login', { phone: digits, password: adminPassword });
      await applyAuthResponse({ ...response.data, role: response.data?.role || "admin" });
      setIsUserAuthenticated(true);
      setPhoneVerified(true);
      setPhoneLocked(true);
      setSmsRequested(false);
      setSmsStep(0);
      setSmsCode("");
      setAdminPassword("");
      setPhoneEditedSinceProfile(false);
    } catch (err) {
      console.error("Ошибка при входе админа:", err);
      setAuthError("Неверный пароль.");
    }
  };

  const onClickEditPhone = () => {
    setPhoneLocked(false);
    setPhoneVerified(false);
    setPhoneEditedSinceProfile(true);
    setSmsRequested(false);
    setSmsStep(0);
    setAuthError("");
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

  async function createDraftOrder() {
    const fd = new FormData();

    fd.append("firstName", userData.firstName || "");
    fd.append("lastName", userData.lastName || "");
    fd.append("middleName", userData.middleName || "");
    fd.append("phone", userData.phone || "");
    fd.append("recipientPhoneDigits", normalizePhoneDigits(userData.phone) || "");
    fd.append("recipientFullName", `${userData.lastName || ""} ${userData.firstName || ""} ${userData.middleName || ""}`.trim());

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
    fd.append("comment", comment || "");

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
      setOrderId(data.orderId);
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
    try {
      const { orderId: oid, cdekNumber: cdekNum } = await createDraftOrder();
      setOrderId(oid);

      if (isCustomType) {
        try {
          await api.post(`/orders/confirm/${encodeURIComponent(oid)}`, { provider: "manual" });
        } catch (confirmErr) {
          console.warn("Manual confirm failed:", confirmErr);
        }
        setIsPaying(false);
        navigate("/thank-you", { state: { orderNumber: oid, manual: true, cdekNumber: cdekNum || null } });
        return;
      }

      const { data } = await api.post('/payments/paykeeper/link', { orderId: oid });
      sessionStorage.setItem('pay_order_id', String(oid));
      sessionStorage.setItem('pay_cdek_number', cdekNum ? String(cdekNum) : "");
      window.location.href = data.pay_url;
    } catch (e) {
      setError(e.message || 'Не удалось создать заказ или перейти к оплате');
      setIsPaying(false);
      }
    }

  useEffect(() => {
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
        await api.post(`/orders/confirm/${encodeURIComponent(orderId)}`, {});
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
    <div className="containerDetails">
      <div className="firstColumn">
        <div className="recipientInfo">
          <p className="title">ДАННЫЕ О ПОЛУЧАТЕЛЕ:</p>
          <div className="data">
            <div className="FIO">
              <input type="text" name="lastName" placeholder="Фамилия" value={userData.lastName} onChange={handleInputChange} />
              <input type="text" name="firstName" placeholder="Имя" value={userData.firstName} onChange={handleInputChange} />
              <input type="text" name="middleName" placeholder="Отчество" value={userData.middleName} onChange={handleInputChange} />
            </div>
            <div className="PhoneContainer">
              <div className="PhoneBlock">
                <input
                  type="tel"
                  name="phone"
                  placeholder="+7 (___) ___-__-__"
                  value={userData.phone}
                  onChange={handleInputChange}
                  disabled={phoneLocked || isPaying}
                  maxLength={18}
                />

                {phoneFromProfile && phoneLocked && (
                  <button
                    type="button"
                    className="link-like"
                    onClick={onClickEditPhone}
                  >
                    изменить
                  </button>
                )}
              </div>

              {(!phoneLocked || !phoneFromProfile) && (
                <div>
                  {!smsRequested ? (
                    <button
                      type="button"
                      className="link-like"
                      onClick={requestSms}
                    >
                      подтвердить номер телефона
                    </button>
                  ) : (
                    <>
                      {smsStep === 1 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Код из SMS"
                            value={smsCode}
                            onChange={(e) => setSmsCode(e.target.value)}
                            maxLength={6}
                            style={{ width: 140 }}
                          />
                          <button type="button" onClick={confirmSmsCode} className="btn-confirm">подтвердить</button>
                          <button
                            type="button"
                            onClick={resendSms}
                            disabled={resendTimer > 0}
                            className="link-like"
                            style={{ textDecoration: "underline", background: "none", border: "none", cursor: resendTimer > 0 ? "not-allowed" : "pointer" }}
                          >
                            {resendTimer > 0 ? `Можно отправить снова через (${resendTimer} c)` : "Отправить код ещё раз"}
                          </button>
                        </div>
                      )}

                      {smsStep === 2 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                          <input
                            type="password"
                            placeholder="Пароль администратора"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            style={{ width: 200 }}
                          />
                          <button type="button" onClick={confirmAdminPassword} className="btn-confirm">подтвердить</button>
                        </div>
                      )}
                    </>
                  )}

                  {!!authError && (
                    <div style={{ color: 'crimson', marginTop: 6, fontSize: 13 }}>{authError}</div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        <div className="deliveryInfo">
          <p className="title">Выбор пункта выдачи (СДЭК)</p>
          <div className="blockCDEK">
            <div className="mapBox">
              <div id="cdek-map" />
            </div>
            <MyCdekWidget
              productType={productType}
              onAddressSelect={setPickupPoint}
              onRateSelect={setDeliveryPrice}
              onCdekSelect={handleCdekSelect}
            />
            <label>
              <input type="checkbox" checked={isNoCdek} onChange={handleNoCdekToggle} />
              В моём городе нет СДЭКа
            </label>
            {isNoCdek && (
              <div className="manualAddress">
                <AddressSuggestions
                  token={dadataToken}
                  value={manualAddress}
                  onChange={setManualAddress}
                  inputProps={{
                    placeholder: "Введите свой адрес",
                  }}
                />
                {!isManualAddressFull && (
                  <p className="manualAddress__hint">Пожалуйста, выберите подсказку с указанием дома.</p>
                )}
                {manualAddress?.value && (
                  <p className="manualAddress__selected">Вы выбрали: {manualAddress.value}</p>
                )}
              </div>
            )}
            </div>
          </div>
        </div>

      <div className="secondColumn">
        <div className="deliveryCost">
          <p className="title">РАСЧЁТ СТОИМОСТИ</p>
          <div className="aboutPrice">
            <div className="aboutPrice_calculate">
              <p>Вышивка:</p>
              <span className={`aboutPrice_value${isCustomType ? " aboutPrice_value--manager" : ""}`}>
                {isCustomType ? "стоимость рассчитает менеджер" : `${embroideryPrice || 0} \u20bd`}
              </span>
            </div>
            <div className="aboutPrice_calculate">
              <p>Доставка:</p>
              <span className="aboutPrice_value">{`${deliveryPrice || 0} \u20bd`}</span>
            </div>
            <div className="summaryCost"><p>ИТОГО:</p> {isCustomType ? `${deliveryPrice || 0} \u20bd` : `${totalPrice} \u20bd`}</div>
          </div>

          {error && <div className="error" style={{ color: "crimson", marginTop: 8 }}>{error}</div>}

          <div className="tooltip-container">
            <button
              onClick={handlePayment}
              disabled={!isFormValid || isPaying}
              className="confirmButton"
            >
              {isPaying ? "Обрабатываем..." : isCustomType ? "ОТПРАВИТЬ ЗАЯВКУ" : "ПЕРЕЙТИ К ОПЛАТЕ"}
            </button>
            {!isFormValid && (
              <div className="tooltip-text">{getMissingFieldsMessage()}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipientDetails;
