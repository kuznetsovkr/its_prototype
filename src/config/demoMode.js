const TRUE_VALUES = new Set(["1", "true", "yes", "on", "demo"]);

const parseBooleanEnv = (value) =>
  TRUE_VALUES.has(String(value || "").trim().toLowerCase());

export const IS_DEMO_MODE = parseBooleanEnv(process.env.REACT_APP_DEMO_MODE);
