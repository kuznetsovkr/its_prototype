export const ORDER_STEP_PATHS = [
  "/order",
  "/embroidery",
  "/recipient",
];

export const ORDER_FLOW_PATHS = [
  ...ORDER_STEP_PATHS,
  "/payment-success",
  "/payment-fail",
  "/thank-you",
];

export const PUBLIC_APP_PATHS = [
  "/",
  "/certificate",
  "/privacy",
  "/offer",
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

export const isOrderStepPath = (value) => ORDER_STEP_PATHS.includes(normalizeAppPath(value));
