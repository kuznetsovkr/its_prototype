import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MyCdekWidget from "../components/MyCdekWidget";
import { AddressSuggestions } from 'react-dadata';
import api from '../api';

/**
 * Ключевые изменения против вашей версии:
 * 1) Перед оплатой создаём заказ на бэке (status=pending) -> получаем orderId
 * 2) Окно оплаты (пока фейк) открываем после успешного создания заказа
 * 3) На сообщение об успешной оплате временно дергаем POST /orders/:id/confirm
 * 4) Переходим на страницу "спасибо" только после confirm (или параллельно, но confirm всё равно уедет на бэк)
 * 5) Проверяем origin у postMessage, не даём двойных кликов
 */


async function postJSON(url, body, token) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Request failed ${res.status}`);
  return res.json();
}

const RecipientDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedType, customText, uploadedImage, comment, productType, color, size } = location.state || {};

  const [userData, setUserData] = useState({ firstName: "", lastName: "", middleName: "", phone: "" });
  const [pickupPoint, setPickupPoint] = useState(""); // address.name
  const [deliveryPrice, setDeliveryPrice] = useState(null); // rate.delivery_sum
  const [manualAddress, setManualAddress] = useState(null);

  const mockEmbroideryPrice = 1200;
  const totalPrice = useMemo(() => mockEmbroideryPrice + (deliveryPrice || 0), [deliveryPrice]);

  const [isUserAuthenticated, setIsUserAuthenticated] = useState(!!localStorage.getItem("token"));
  const [isPaying, setIsPaying] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const { data: response } = await api.get('/user/me');
        if (response.ok) {
          const data = await response.json();
          setUserData({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            middleName: data.middleName || "",
            phone: data.phone || "",
          });
        }
      } catch (e) {
        console.error("Ошибка получения данных пользователя:", e);
      }
    };
    if (isUserAuthenticated) fetchUserData();
  }, [isUserAuthenticated]);

  // Создание черновика заказа на бэке до оплаты
  async function createDraftOrder() {
    const token = localStorage.getItem("token");
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
      const { data } = await api.post('/orders/create', fd); // FormData — заголовок проставится сам
      setOrderId(data.orderId);
      return data; // { orderId, ... }
    } catch (err) {
      // В интерсепторе мы уже формируем понятное сообщение
      throw new Error(err.message || 'Create failed');
    }
  }

  // Открыть фейковую оплату
  async function handlePayment() {
    if (isPaying) return;
    setError(""); setIsPaying(true);
    try {
      const { orderId: oid } = await createDraftOrder();
      const url = `/payment?orderId=${encodeURIComponent(oid)}`; // страница с PaymentPage
      const w = window.open(url, "_blank", "width=520,height=640");
      if (!w) throw new Error("Попап заблокирован");
    } catch (e) {
      setError(e.message || "Ошибка при создании заказа");
      setIsPaying(false);
    }
  }

  // Обработка сообщения об успешной оплате из фейкового окна
  // Обработка сообщения об успешной оплате из фейкового окна
  useEffect(() => {
    let confirming = false;

    const onMessage = async (event) => {
      // Безопасность: принимаем только от своего origin
      if (event.origin !== window.location.origin) return;

      const ok =
        event.data === "payment_success" ||
        (event.data &&
          event.data.type === "payment_status" &&
          event.data.status === "success");

      if (!ok) return;

      console.log("[PAYMENT OK] event:", event.data, "orderId:", orderId);

      if (!orderId) {
        console.warn("[PAYMENT OK] но orderId ещё не создан");
        setError("Не удалось определить номер заказа. Попробуйте ещё раз.");
        setIsPaying(false);
        return;
      }

      if (confirming) return; // защита от дубля
      confirming = true;

      try {
        await api.post(`/orders/confirm/${encodeURIComponent(orderId)}`, {}); // тело {} как в исходнике
        // ✅ всё ок — уходим на спасибо
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


  // Форма и валидации
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const [isNoCdek, setIsNoCdek] = useState(false);
  const dadataToken = "0821b30c8abbf80ea31555ae120fed168b30b8dc"; // замените на свой

  const isUserDataFilled = Object.values(userData).every((val) => String(val).trim() !== "");
  const isDeliveryAddressFilled = !!pickupPoint || !!manualAddress?.value;
  const isFormValid = isUserDataFilled && isDeliveryAddressFilled;

  const getMissingFieldsMessage = () => {
    const missing = [];
    if (!userData.lastName.trim()) missing.push("фамилию");
    if (!userData.firstName.trim()) missing.push("имя");
    if (!userData.middleName.trim()) missing.push("отчество");
    if (!userData.phone.trim()) missing.push("телефон");
    if (!pickupPoint && !manualAddress?.value) missing.push("адрес");
    if (missing.length === 0) return "";
    const last = missing.pop();
    const list = missing.length ? `${missing.join(', ')} и ${last}` : last;
    return `Пожалуйста, заполните ${list}`;
  };

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
            <div>
              <input type="tel" name="phone" placeholder="Номер телефона" value={userData.phone} onChange={handleInputChange} />
            </div>
          </div>
        </div>

        <div className="deliveryInfo">
          <p className="title">Выбор пункта выдачи (СДЭК)</p>
          <div className="blockCDEK">
            <div id="cdek-map">
                            <MyCdekWidget 
                                onAddressSelect={setPickupPoint}
                                onRateSelect={setDeliveryPrice}
                            />            
                            </div>
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