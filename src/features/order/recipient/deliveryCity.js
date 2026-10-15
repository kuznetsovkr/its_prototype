export const normalizeDeliveryCity = (value, now = Date.now()) => {
  if (!value || typeof value.id !== "string" || typeof value.name !== "string" || !value.name.trim()
    || typeof value.label !== "string" || !value.label.trim() || typeof value.token !== "string" || !value.token
    || !Number.isFinite(value.expiresAt) || value.expiresAt <= now
    || !Number.isFinite(value.longitude) || Math.abs(value.longitude) > 180
    || !Number.isFinite(value.latitude) || Math.abs(value.latitude) > 90) return null;
  return { id: value.id.slice(0, 64), name: value.name.slice(0, 120), label: value.label.slice(0, 255),
    longitude: value.longitude, latitude: value.latitude, token: value.token.slice(0, 2048),
    expiresAt: value.expiresAt, pickup: value.pickup === true };
};
export const isDeliveryCitySelected = (city) => Boolean(normalizeDeliveryCity(city));
export const deliveryCityCoordinates = (city) => {
  const normalized = normalizeDeliveryCity(city);
  return normalized ? [normalized.longitude, normalized.latitude] : null;
};
// Only used by the existing explicit demo/test mode, never by real checkout.
export const demoDeliveryCity = () => ({ id: "cdek:278", name: "Красноярск", label: "Красноярский край, г Красноярск",
  longitude: 92.868, latitude: 56.0106, pickup: true, token: "demo-city", expiresAt: Date.now() + 30 * 24 * 60 * 60_000 });
