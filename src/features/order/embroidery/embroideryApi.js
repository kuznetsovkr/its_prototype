import api from "../../../api";

export const getEmbroideryPrices = async (selection) => {
  const { data } = await api.post("/pricing/quote", selection);
  return data?.prices ? { ...data.prices, carDesignPrices: data.carDesignPrices || null, clothingTypeCode: data.clothingTypeCode || "" } : null;
};
