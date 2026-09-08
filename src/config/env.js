const firstDefined = (...values) => values.find((value) => value !== undefined && value !== "");

export const APP_ENV = {
  apiUrl: firstDefined(import.meta.env.VITE_API_URL, import.meta.env.REACT_APP_API_URL, "/api"),
  cdekServiceUrl: firstDefined(
    import.meta.env.VITE_CDEK_SERVICE_URL,
    import.meta.env.REACT_APP_CDEK_SERVICE_URL,
    ""
  ),
  ymapsKey: firstDefined(import.meta.env.VITE_YMAPS_KEY, import.meta.env.REACT_APP_YMAPS_KEY, ""),
  dadataToken: firstDefined(
    import.meta.env.VITE_DADATA_TOKEN,
    import.meta.env.REACT_APP_DADATA_TOKEN,
    ""
  ),
  demoMode: firstDefined(import.meta.env.VITE_DEMO_MODE, import.meta.env.REACT_APP_DEMO_MODE, "false"),
  isDevelopment: import.meta.env.DEV,
};
