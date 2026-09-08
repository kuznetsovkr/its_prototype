import api from "../../../api";
import { orderAccessConfig } from "../../../utils/orderAccess";

export const createOrder = async (formData) => {
  const { data } = await api.post("/orders/create", formData);
  if (!data?.orderId || !data?.orderToken) {
    throw new Error("Сервер не вернул данные доступа к заказу");
  }
  return data;
};

export const confirmOrder = async (orderId, provider, orderToken) => {
  await api.post(
    `/orders/confirm/${encodeURIComponent(orderId)}`,
    { provider },
    orderAccessConfig(orderId, orderToken)
  );
};

export const getPaymentLink = async (orderId, orderToken) => {
  const { data } = await api.post(
    "/payments/paykeeper/link",
    { orderId },
    orderAccessConfig(orderId, orderToken)
  );
  return data.pay_url;
};

export const getCheckoutQuote = async (selection) => {
  const { data } = await api.post("/pricing/checkout", selection);
  return data;
};
