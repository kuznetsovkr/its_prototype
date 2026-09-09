import api from "../../../api";
import { IS_DEMO_MODE } from "../../../config/demoMode";
import { DEMO_INVENTORY } from "../../../mocks/demoData";
import { normalizeKey, uniqBy } from "./clothingCatalog";

const buildDemoCatalog = () => ({
  inventory: DEMO_INVENTORY,
  clothingTypes: uniqBy(
    DEMO_INVENTORY.map((item) => ({ name: String(item.productType || "").trim() }))
      .filter((item) => item.name),
    (item) => normalizeKey(item.name)
  ),
  colors: uniqBy(
    DEMO_INVENTORY.map((item) => ({
      name: item.color,
      code: item.colorCode || item.color || "#CCCCCC",
    })).filter((item) => item.name),
    (item) => normalizeKey(item.name)
  ),
});

export const loadClothingCatalog = async () => {
  if (IS_DEMO_MODE) return buildDemoCatalog();

  const [inventoryResult, typesResult, colorsResult] = await Promise.allSettled([
    api.get("/inventory"),
    api.get("/clothing-types"),
    api.get("/colors"),
  ]);

  if (inventoryResult.status !== "fulfilled" || !Array.isArray(inventoryResult.value.data)) {
    throw inventoryResult.status === "rejected"
      ? inventoryResult.reason
      : new Error("Сервер вернул некорректный список товаров");
  }

  return {
    inventory: inventoryResult.value.data,
    clothingTypes: typesResult.status === "fulfilled" && Array.isArray(typesResult.value.data)
      ? typesResult.value.data
      : [],
    colors: colorsResult.status === "fulfilled" && Array.isArray(colorsResult.value.data)
      ? colorsResult.value.data
      : [],
  };
};
