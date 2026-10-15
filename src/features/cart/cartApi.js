import axios from "axios";
import { API_BASE } from "../../api";
import { isCartId } from "./cartStorage";

const client = axios.create({ baseURL: API_BASE, timeout: 60_000, headers: { Accept: "application/json" } });
client.interceptors.response.use((response) => response, (error) => {
  const failure = new Error(error.response?.data?.message || "Корзина временно недоступна. Попробуйте ещё раз");
  failure.status = error.response?.status;
  failure.code = error.response?.data?.code;
  return Promise.reject(failure);
});
const idPath = (id) => {
  if (!isCartId(id)) throw new Error("Некорректный идентификатор корзины или изделия");
  return encodeURIComponent(id);
};
const path = (access) => `/cart/${idPath(access.id)}`;
const config = (access) => ({ headers: { "X-Cart-Access-Token": access.token } });

export const cartApi = {
  createSession: async (turnstileToken) => (await client.post("/cart/session", { turnstileToken })).data,
  load: async (access) => (await client.get(path(access), config(access))).data,
  add: async (access, formData, requestKey) => (await client.post(`${path(access)}/items`, formData, {
    headers: { ...config(access).headers, "Idempotency-Key": requestKey },
  })).data,
  setQuantity: async (access, itemId, quantity) => (await client.patch(`${path(access)}/items/${idPath(itemId)}`, { quantity }, config(access))).data,
  remove: async (access, itemId) => (await client.delete(`${path(access)}/items/${idPath(itemId)}`, config(access))).data,
  clear: async (access) => (await client.delete(path(access), config(access))).data,
  quote: async (access, input) => (await client.post(`${path(access)}/quote`, input, config(access))).data,
  checkout: async (access, input, requestKey) => (await client.post(`${path(access)}/checkout`, input, {
    headers: { ...config(access).headers, "Idempotency-Key": requestKey },
  })).data,
  cancelCheckout: async (access) => (await client.post(`${path(access)}/checkout/cancel`, {}, config(access))).data,
  readAttachment: async (access, itemId, attachmentId) => (await client.get(
    `${path(access)}/items/${idPath(itemId)}/attachments/${idPath(attachmentId)}`, { ...config(access), responseType: "blob" },
  )).data,
};
