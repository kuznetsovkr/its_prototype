// Only public product choices go to the shipping quote endpoint, never contacts,
// certificate codes, cart access credentials, uploaded photos or user comments.
export const buildShippingItems = (items) => items.map(item => ({
  productType: typeof item.productType === "object" ? item.productType.name || item.productType.type : item.productType,
  color: item.color, size: item.size, embroideryType: item.embroideryType,
  ...(item.embroideryType === "Car" ? { carDesign: item.carDesign } : {}),
  ...(item.embroideryType === "Patronus" ? { patronusCount: item.patronusCount } : {}),
  ...(item.embroideryType === "petFace" ? { petFaceCount: item.petFaceCount } : {}),
  quantity: item.quantity || 1,
}));
