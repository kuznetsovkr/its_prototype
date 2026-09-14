import api from "../../../api";
import { IS_DEMO_MODE } from "../../../config/demoMode";
import { DEMO_INVENTORY } from "../../../mocks/demoData";
import { normalizeKey, uniqBy } from "./clothingCatalog";

const DEMO_CLOTHING_TYPES = [
  {
    id: "demo-tshirt", name: "T-shirt", code: "tshirt", displayOrder: 10,
    sizeGuideKey: "tshirt", patronusLimit: 1,
    prices: { Patronus: 8500, Car: 6500, petFace: 6000 },
    package: { width: 30, height: 20, length: 3, weight: 300 },
    price: 6000,
  },
  {
    id: "demo-hoodie", name: "Hoodie", code: "hoodie", displayOrder: 20,
    sizeGuideKey: "hoodie", patronusLimit: 5,
    prices: { Patronus: 10000, Car: 8500, petFace: 8000 },
    package: { width: 35, height: 35, length: 7, weight: 800 },
    price: 8000,
  },
  {
    id: "demo-svitshot", name: "Sweatshirt", code: "svitshot", displayOrder: 30,
    sizeGuideKey: "svitshot", patronusLimit: 5,
    prices: { Patronus: 9500, Car: 8000, petFace: 7000 },
    package: { width: 35, height: 35, length: 7, weight: 800 },
    price: 7000,
  },
];

const buildDemoCatalog = () => {
  const typeByName = new Map(DEMO_CLOTHING_TYPES.map((type) => [normalizeKey(type.name), type]));
  const inventory = DEMO_INVENTORY.map((item) => {
    const clothingType = typeByName.get(normalizeKey(item.productType));
    return {
      ...item,
      clothingTypeId: clothingType?.id,
      clothingType,
      price: clothingType?.price ?? null,
    };
  });
  return {
    inventory,
    clothingTypes: DEMO_CLOTHING_TYPES,
    colors: uniqBy(
      DEMO_INVENTORY.map((item) => ({
        name: item.color,
        code: item.colorCode || item.color || "#CCCCCC",
      })).filter((item) => item.name),
      (item) => normalizeKey(item.name)
    ),
  };
};

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
