const storageKey = (orderId) => `order_access:${String(orderId)}`;

export const storeOrderAccessToken = (orderId, token) => {
  if (!orderId || !token) return;
  sessionStorage.setItem(storageKey(orderId), token);
};

export const getOrderAccessToken = (orderId) => {
  if (!orderId) return null;
  return sessionStorage.getItem(storageKey(orderId));
};

export const orderAccessConfig = (orderId, token) => {
  const accessToken = token || getOrderAccessToken(orderId);
  return accessToken
    ? { headers: { "X-Order-Access-Token": accessToken } }
    : {};
};
