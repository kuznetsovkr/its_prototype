// Keep module import safe for server-rendered fields; requests only run in the browser.
const getApi = async () => (await import("../../../api")).default;

export const suggestDeliveryCities = async (query, signal) => {
  const api = await getApi();
  const { data } = await api.post("/delivery/cities/suggest", { query }, { signal });
  return Array.isArray(data?.suggestions) ? data.suggestions : [];
};
export const resolveDeliveryCity = async (id, signal) => {
  const api = await getApi();
  const { data } = await api.post("/delivery/cities/resolve", { id }, { signal });
  return data.city;
};
export const resolveOfficeCity = async (officeCode, signal) => {
  const api = await getApi();
  const { data } = await api.post("/delivery/cities/office", { officeCode }, { signal });
  return data.city;
};
