export const DELIVERY_METHODS = Object.freeze(["cdek", "russian_post", "pickup", "manual"]);
// orders.deliveryAddress holds 255 characters, including the server's carrier prefix.
export const POSTAL_POINT_MAX_LENGTH = 241;

export const SELF_PICKUP = Object.freeze({
  address: "Красноярск, ул. Ломоносова, 11",
  schedule: "Время по согласованию",
});

export const restoreDeliveryMethod = (recipient = {}) => DELIVERY_METHODS.includes(recipient.deliveryMethod)
  ? recipient.deliveryMethod : recipient.isNoCdek ? "manual" : "cdek";

// The retired "no CDEK" choice must not return in an editable checkout. Keep
// existing saved orders resumable without changing their delivery or invoices.
export const restoreCheckoutDeliveryMethod = (recipient, hasSavedOrder = false) => {
  const method = restoreDeliveryMethod(recipient);
  return method === "manual" && !hasSavedOrder ? "cdek" : method;
};
