export const ORDER_FLOW_PATHS = [
  "/order",
  "/embroidery",
  "/recipient",
  "/payment-success",
  "/payment-fail",
  "/thank-you",
];

export const PUBLIC_APP_PATHS = [
  "/",
  "/certificate",
  ...ORDER_FLOW_PATHS,
  "/admin",
  "/admin/inventory",
];

export const normalizeAppPath = (value) => {
  const path = String(value || "/");
  if (path === "/") return path;
  return path.replace(/\/+$/, "") || "/";
};

export const isOrderFlowPath = (value) => ORDER_FLOW_PATHS.includes(normalizeAppPath(value));
