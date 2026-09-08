import hoodieImg from "../../../images/hoodie.jpg";
import switshotImg from "../../../images/switshot.jpg";
import tshirtImg from "../../../images/tshirt.jpg";

export const isWhite = (color = "") => {
  const value = String(color).trim().toLowerCase();
  return ["#fff", "#ffffff", "white", "rgb(255,255,255)"].includes(value);
};

export const normalizeInner = (value) => {
  if (!value) return null;
  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/\s+/g, " ");
  if (normalized.includes("с начес")) return "с начёсом";
  if (normalized.includes("без начес")) return "без начёса";
  return null;
};

export const parseTypeLabel = (rawValue) => {
  const value = String(rawValue ?? "").trim();
  const match = value.match(/^(.*?)(?:\s*\(([^)]+)\))?\s*$/);
  return {
    base: (match?.[1] ?? "").trim(),
    inner: normalizeInner(match?.[2]),
  };
};

export const uniqBy = (items, getKey) => {
  const unique = new Map();
  items.forEach((item) => {
    const key = getKey(item);
    if (!unique.has(key)) unique.set(key, item);
  });
  return Array.from(unique.values());
};

export const hasStock = (item) => {
  const quantity = Number(item?.quantity ?? 0);
  return Number.isFinite(quantity) && quantity > 0;
};

export const normalizeKey = (value) => String(value || "").trim().toLowerCase();

export const CORE_SIZES = ["XS", "S", "M", "L", "XL"];

export const SIZE_COLUMNS = [
  "Размер",
  "Ширина под проймой",
  "Длина по переду",
  "Длина плеча",
  "Длина рукава",
];

export const SIZE_CHARTS = {
  hoodie: {
    title: "худи",
    image: hoodieImg,
    rows: [
      ["XS", "63", "73", "20,5", "58,5"],
      ["S", "65", "75", "21", "59,5"],
      ["M", "67", "77", "21,5", "60"],
      ["L", "69", "78", "22", "60,5"],
      ["XL", "71", "79", "22,5", "61"],
      ["XXL", "73", "80", "23", "61,5"],
    ],
  },
  svitshot: {
    title: "свитшот",
    image: switshotImg,
    rows: [
      ["XS", "63", "71", "22", "58,5"],
      ["S", "65", "73", "22,5", "59,5"],
      ["M", "67", "75", "23", "60"],
      ["L", "69", "77", "23,5", "60,5"],
      ["XL", "71", "78", "24", "61"],
      ["XXL", "73", "79", "24,5", "61,5"],
    ],
  },
  tshirt: {
    title: "футболка",
    image: tshirtImg,
    rows: [
      ["XS", "54", "67", "17", "24"],
      ["S", "56", "69", "17,5", "24,5"],
      ["M", "58", "73", "18", "25"],
      ["L", "60", "75", "18,5", "25,5"],
      ["XL", "62", "77", "19", "26"],
      ["XXL", "64", "79", "19,5", "26,5"],
    ],
  },
  default: {
    title: "изделие",
    image: tshirtImg,
    rows: [
      ["XS", "54", "67", "17", "24"],
      ["S", "56", "69", "17,5", "24,5"],
      ["M", "58", "73", "18", "25"],
      ["L", "60", "75", "18,5", "25,5"],
      ["XL", "62", "77", "19", "26"],
      ["XXL", "64", "79", "19,5", "26,5"],
    ],
  },
};

export const detectChartKey = (baseType) => {
  const raw = String(baseType || "").toLowerCase();
  const name = `${raw} ${raw
    .replace(/худи/g, "hudi")
    .replace(/свитшот/g, "svitshot")
    .replace(/свит/g, "svit")
    .replace(/футбол/g, "futbol")}`;
  if (name.includes("hudi") || name.includes("hoodie")) return "hoodie";
  if (name.includes("svitshot") || name.includes("sweatshirt")) return "svitshot";
  if (["t-shirt", "tshirt", "tee", "futbol"].some((part) => name.includes(part))) {
    return "tshirt";
  }
  return "default";
};

export const TYPE_ORDER = { tshirt: 1, hoodie: 2, svitshot: 3, default: 99 };
export const INNER_ORDER = { "с начёсом": 1, "без начёса": 2 };
export const COLOR_ORDER = new Map([
  ["белый", 1], ["white", 1],
  ["чёрный", 2], ["черный", 2], ["black", 2],
  ["серый", 3], ["gray", 3], ["grey", 3],
  ["красный", 4], ["red", 4],
  ["синий", 5], ["blue", 5],
]);
