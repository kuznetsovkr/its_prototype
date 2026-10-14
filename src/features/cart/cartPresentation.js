export const GROUP_PAYMENT_NOTICE = "Оплата корзины будет подключена на следующем этапе. Сейчас можно сохранить изделия, изменить количество или удалить позиции.";

export const currentCartItem = (order) => {
  const { clothing, embroidery } = order;
  if (!clothing.type || !clothing.color || !clothing.size || !embroidery.type) return null;
  return { id: "current", productType: clothing.profile?.name || clothing.type, color: clothing.color, size: clothing.size,
    embroideryType: embroidery.type, patronusCount: embroidery.patronusCount, petFaceCount: embroidery.petFaceCount,
    imageUrl: clothing.previewSrc, quantity: 1, current: true };
};

export const cartEmbroideryLabel = (item) => {
  const names = { Patronus: "Патронус", Car: "Автомобиль", petFace: "Мордочка питомца", custom: "Индивидуальная вышивка" };
  const count = item.embroideryType === "Patronus" ? item.patronusCount : item.embroideryType === "petFace" ? item.petFaceCount : 1;
  return `${names[item.embroideryType] || item.embroideryTypeRu || item.embroideryType}${count > 1 ? ` × ${count}` : ""}`;
};

export const cartPaymentBlocked = (cart, { cartOnly = false, isCustom = false } = {}) =>
  !cart.initialized || cart.pending || Boolean(cart.error) || cartOnly || (!isCustom && cart.items.length > 0);
