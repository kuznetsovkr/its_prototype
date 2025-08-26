import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MyCdekWidget from "../components/MyCdekWidget";
import { AddressSuggestions } from 'react-dadata';

/**
 * Ключевые изменения против вашей версии:
 * 1) Перед оплатой создаём заказ на бэке (status=pending) -> получаем orderId
 * 2) Окно оплаты (пока фейк) открываем после успешного создания заказа
 * 3) На сообщение об успешной оплате временно дергаем POST /orders/:id/confirm
 * 4) Переходим на страницу "спасибо" только после confirm (или параллельно, но confirm всё равно уедет на бэк)
 * 5) Проверяем origin у postMessage, не даём двойных кликов
 */

const API = "http://localhost:5000/api"; // вынесено в константу

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
        const response = await fetch(`${API}/user/me`, { headers: { Authorization: `Bearer ${token}` } });
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

    // Важно: передаём ИД варианта/sku, либо productId+color+size
    const payload = {
      // user (если юзер не авторизован — бэк берёт эти поля из тела)
      firstName: userData.firstName,
      lastName:  userData.lastName,
      middleName:userData.middleName,
      phone:     userData.phone,

      // товар
      productType: typeof productType === 'object'
        ? (productType.name ?? productType.type ?? String(productType))
        : productType,
      color,
      size,

      // кастомизация
      embroideryType: selectedType,
      customText,
      comment,

      // доставка/суммы (ты уже их читаешь в /create)
      totalPrice: totalPrice,
      deliveryAddress: pickupPoint || (manualAddress && manualAddress.value) || '',
    };

    const data = await postJSON(`${API}/orders/create`, payload, token);
    // ожидаем { orderId, paymentUrl? }
    setOrderId(data.orderId);
    return data;
  }

  // Открыть фейковую оплату
  async function handlePayment() {
    if (isPaying) return; // защита от повторов
    setError("");
    setIsPaying(true);
    try {
      const { orderId: oid, paymentUrl } = await createDraftOrder();

      // для удобства передаём orderId в фейковое окно
      const url = paymentUrl || `/fake-payment?orderId=${encodeURIComponent(oid)}`;
      const paymentWindow = window.open(url, "_blank", "width=500,height=600");
      if (!paymentWindow) throw new Error('Не удалось открыть окно оплаты (popup blocker).');
    } catch (e) {
      console.error(e);
      setError(e.message || 'Ошибка при создании заказа');
      setIsPaying(false);
    }
  }

  // Обработка сообщения об успешной оплате из фейкового окна
  useEffect(() => {
    const onMessage = async (event) => {
      try {
        // Безопасность: принимаем сообщения только с текущего origin
        if (event.origin !== window.location.origin) return;

        const ok = event.data === 'payment_success' ||
                   (event.data && typeof event.data === 'object' && event.data.type === 'payment_status' && event.data.status === 'success');
        if (!ok) return;

        if (!orderId) {
          console.warn('payment_success получен, но orderId ещё не создан');
          return;
        }

        // Временный confirm до вебхука
        try {
          await postJSON(`${API}/orders/confirm/${orderId}`, {});
        } catch (e) {
          console.error('Ошибка confirm', e);
          // При фейке можно всё равно пустить на страницу спасибо, но лучше показать ошибку
        }

        // Навигация на страницу "спасибо"
        navigate('/payment', {
          state: {
            orderId,
            userData,
            selectedProduct: {
              productType,
              color,
              size,
              embroideryType: selectedType,
              customText,
              uploadedImage,
              comment,
            },
            deliveryAddress: pickupPoint || manualAddress?.value,
            totalPrice,
          },
          replace: true,
        });
      } finally {
        setIsPaying(false);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [orderId, navigate, userData, selectedType, customText, uploadedImage, comment, productType, color, size, pickupPoint, manualAddress, totalPrice]);

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
