import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MyCdekWidget from "../components/MyCdekWidget";
import { AddressSuggestions } from 'react-dadata';
import api from '../api';

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
  const { selectedType, customText, uploadedImage, comment, productType, color, size } = location.state || {};

  const [userData, setUserData] = useState({ firstName: "", lastName: "", middleName: "", phone: "" });

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
  const [pickupPoint, setPickupPoint] = useState(""); // address.name
  const [deliveryPrice, setDeliveryPrice] = useState(null); // rate.delivery_sum
  const [manualAddress, setManualAddress] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState("");

  // Цены
  const mockEmbroideryPrice = 1200;
  const totalPrice = useMemo(() => mockEmbroideryPrice + (deliveryPrice || 0), [deliveryPrice]);

  // Dadata
  const [isNoCdek, setIsNoCdek] = useState(false);
  const dadataToken = "0821b30c8abbf80ea31555ae120fed168b30b8dc"; // ваш токен

  // Подтягиваем профиль
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isUserAuthenticated) return;
      try {
        const { data } = await api.get('/user/me');
        const maskedPhone = data?.phone ? formatPhoneNumber(String(data.phone)) : "";
        setUserData({
          firstName: data?.firstName ?? "",
          lastName: data?.lastName ?? "",
          middleName: data?.middleName ?? "",
          phone: maskedPhone,
        });

        const hasProfilePhone = Boolean(data?.phone);
        setPhoneFromProfile(hasProfilePhone);
        setPhoneLocked(hasProfilePhone);
        setPhoneVerified(hasProfilePhone); // авторизован и телефон пришёл — считаем ок, пока не изменён
        setPhoneEditedSinceProfile(false);
      } catch (e) {
        console.error("Ошибка получения данных пользователя:", e);
      }
    };
    fetchUserData();
  }, [isUserAuthenticated]);

  // Маска/валидация для полей
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Маска только для телефона
    if (name === 'phone') {
      const masked = formatPhoneNumber(value);
      setUserData((prev) => ({ ...prev, phone: masked }));
      setAuthError("");
      if (phoneFromProfile) {
        setPhoneEditedSinceProfile(true);
        setPhoneVerified(false); // при редактировании подтверждение слетает
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

  const isDeliveryAddressFilled = !!pickupPoint || !!manualAddress?.value;

  // Телефон ок для оплаты, если подтверждён ИЛИ (пришёл из профиля, поле заблокировано и не редактировалось)
  const isPhoneOk = phoneVerified || (phoneFromProfile && phoneLocked && !phoneEditedSinceProfile);
  const isFormValid = isUserDataFilled && isDeliveryAddressFilled && isPhoneOk;

  const getMissingFieldsMessage = () => {
    const missing = [];
    if (!userData.lastName.trim()) missing.push("фамилию");
    if (!userData.firstName.trim()) missing.push("имя");
    if (!userData.middleName.trim()) missing.push("отчество");
    if (!userData.phone.trim()) missing.push("телефон");
    if (!pickupPoint && !manualAddress?.value) missing.push("адрес");
    if (!isPhoneOk) missing.push("подтвердите телефон");
    if (missing.length === 0) return "";
    const last = missing.pop();
    const list = missing.length ? `${missing.join(', ')} и ${last}` : last;
    return `Пожалуйста, заполните ${list}`;
  };

  // ====== SMS: запрос/повтор/подтверждение ======
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
      // Если бэкенд просит пароль — это админ
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
      const token = response.data?.token;
      if (token) {
        localStorage.setItem("token", token);
        setIsUserAuthenticated(true);
      }
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
      const token = response.data?.token;
      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("role", "admin");
        setIsUserAuthenticated(true);
      }
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

  // ====== Создание черновика заказа и оплата ======
  async function createDraftOrder() {
    const fd = new FormData();

    // Данные пользователя
    fd.append("firstName", userData.firstName || "");
    fd.append("lastName", userData.lastName || "");
    fd.append("middleName", userData.middleName || "");
    fd.append("phone", userData.phone || "");

    // Товар
    const productTypeName =
      typeof productType === "object"
        ? (productType.name ?? productType.type ?? String(productType))
        : productType;

    fd.append("productType", productTypeName);
    fd.append("color", color || "");
    fd.append("size", size || "");

    // Кастомизация
    fd.append("embroideryType", selectedType || "");
    fd.append("customText", customText || "");
    fd.append("comment", comment || "");

    // Доставка/сумма
    fd.append("deliveryAddress", pickupPoint || (manualAddress && manualAddress.value) || "");
    fd.append("totalPrice", String(totalPrice || 0));

    // Фото
    (uploadedImage || []).forEach((file, idx) => {
      if (file) fd.append("images", file, file.name || `image_${idx}.jpg`);
    });

    try {
      const { data } = await api.post('/orders/create', fd);
      setOrderId(data.orderId);
      return data; // { orderId, ... }
    } catch (err) {
      throw new Error(err.message || 'Create failed');
    }
  }

  // Открыть оплату
  async function handlePayment() {
    if (isPaying) return;
    setError(''); setIsPaying(true);
    try {
      const { orderId: oid } = await createDraftOrder();
      const { data } = await api.post('/payments/paykeeper/link', { orderId: oid });
      sessionStorage.setItem('pay_order_id', String(oid));
      window.location.href = data.pay_url;
    } catch (e) {
      setError(e.message || 'Ошибка при создании ссылки на оплату');
      setIsPaying(false);
    }
  }

  // Сообщение об успешной оплате
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
        navigate('/thank-you', { state: { orderNumber: orderId } });
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
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
                            style={{ textDecoration: 'underline', background: 'none', border: 'none', cursor: resendTimer > 0 ? 'not-allowed' : 'pointer' }}
                          >
                            {resendTimer > 0 ? `повторно отправить (${resendTimer}с)` : 'повторно отправить код'}
                          </button>
                        </div>
                      )}

                      {smsStep === 2 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
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
            <MyCdekWidget onAddressSelect={setPickupPoint} onRateSelect={setDeliveryPrice} />
            <label>
              <input type="checkbox" checked={isNoCdek} onChange={() => setIsNoCdek((p) => !p)} />
              В моём городе нет СДЭКа
            </label>
            {isNoCdek && (
              <div style={{ marginTop: '12px', maxWidth: '400px' }}>
                <AddressSuggestions
                  token={dadataToken}
                  placeholder="Начните вводить адрес..."
                  query={manualAddress?.value}
                  onChange={(suggestion) => setManualAddress(suggestion)}
                />
                {manualAddress && <p style={{ marginTop: '8px' }}>Вы выбрали: {manualAddress.value}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="secondColumn">
        <div className="deliveryCost">
          <p className="title">РАСЧЁТ СТОИМОСТИ</p>
          <div className="aboutPrice">
            <div className="aboutPrice_calculate"><p>Вышивка:</p> {`${mockEmbroideryPrice} ₽`}</div>
            <div className="aboutPrice_calculate"><p>Доставка:</p> {`${deliveryPrice || 0} ₽`}</div>
            <div className="summaryCost"><p>ИТОГО:</p> {`${totalPrice} ₽`}</div>
          </div>

          {error && <div className="error" style={{ color: 'crimson', marginTop: 8 }}>{error}</div>}

          <div className="tooltip-container">
            <button
              onClick={handlePayment}
              disabled={!isFormValid || isPaying}
              className="confirmButton"
            >
              {isPaying ? 'ОПЛАТА…' : 'ПЕРЕЙТИ К ОПЛАТЕ'}
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
