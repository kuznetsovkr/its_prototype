export const GROUP_PAYMENT_NOTICE = "Добавьте текущее изделие в корзину, чтобы подтвердить общий состав и рассчитать доставку перед оплатой.";
export const UNFINISHED_CART_NOTICE = "В корзине есть незавершённое изделие. Продолжите его оформление или удалите черновик перед оплатой.";

export const constructorCartItem = (order) => {
  const { clothing, embroidery } = order;
  if (!clothing.type || !clothing.color || !clothing.size || order.recipient?.savedOrder) return null;
  return { id: "constructor-draft", productType: clothing.profile?.name || clothing.type, color: clothing.color, size: clothing.size,
    embroideryType: embroidery.type, patronusCount: embroidery.patronusCount, petFaceCount: embroidery.petFaceCount,
    imageUrl: clothing.previewSrc, draft: true };
};

export const getCartDraftItem = (cart, order) => cart.checkout || cart.items.some((item) => item.requestKey === order.cartItemKey)
  ? null : constructorCartItem(order);

export const getCartItemCount = (cart, order) => cart.items.reduce((sum, item) => sum + item.quantity, 0)
  + (getCartDraftItem(cart, order) ? 1 : 0);

export const currentCartItem = (order) => {
  const { clothing, embroidery } = order;
  if (!clothing.type || !clothing.color || !clothing.size || !embroidery.type) return null;
  return { id: "current", productType: clothing.profile?.name || clothing.type, color: clothing.color, size: clothing.size,
    embroideryType: embroidery.type, patronusCount: embroidery.patronusCount, petFaceCount: embroidery.petFaceCount,
    imageUrl: clothing.previewSrc, quantity: 1, current: true };
};

export const cartEmbroideryLabel = (item) => {
  if (!item.embroideryType) return "Вышивка ещё не выбрана";
  const names = { Patronus: "Патронус", Car: "Автомобиль", petFace: "Мордочка питомца", custom: "Индивидуальная вышивка" };
  const count = item.embroideryType === "Patronus" ? item.patronusCount : item.embroideryType === "petFace" ? item.petFaceCount : 1;
  return `${names[item.embroideryType] || item.embroideryTypeRu || item.embroideryType}${count > 1 ? ` × ${count}` : ""}`;
};

export const cartPaymentBlocked = (cart, { cartOnly = false } = {}) =>
  !cart.initialized || cart.pending || (Boolean(cart.error) && !cart.checkout) || (cartOnly && !cart.items.length && !cart.checkout);
