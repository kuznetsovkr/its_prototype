export const DEMO_INVENTORY = [
  {
    id: "demo-hoodie-black-m",
    productType: "Hoodie",
    color: "Black",
    colorCode: "#1F1F1F",
    size: "M",
    quantity: 8,
  },
  {
    id: "demo-hoodie-black-l",
    productType: "Hoodie",
    color: "Black",
    colorCode: "#1F1F1F",
    size: "L",
    quantity: 6,
  },
  {
    id: "demo-hoodie-white-m",
    productType: "Hoodie",
    color: "White",
    colorCode: "#FFFFFF",
    size: "M",
    quantity: 5,
  },
  {
    id: "demo-sweatshirt-gray-s",
    productType: "Sweatshirt",
    color: "Gray",
    colorCode: "#949494",
    size: "S",
    quantity: 7,
  },
  {
    id: "demo-sweatshirt-gray-m",
    productType: "Sweatshirt",
    color: "Gray",
    colorCode: "#949494",
    size: "M",
    quantity: 7,
  },
  {
    id: "demo-tshirt-blue-m",
    productType: "T-shirt",
    color: "Blue",
    colorCode: "#1F4AB8",
    size: "M",
    quantity: 10,
  },
  {
    id: "demo-tshirt-blue-xl",
    productType: "T-shirt",
    color: "Blue",
    colorCode: "#1F4AB8",
    size: "XL",
    quantity: 5,
  },
  {
    id: "demo-tshirt-beige-l",
    productType: "T-shirt",
    color: "Beige",
    colorCode: "#DCCCB2",
    size: "L",
    quantity: 4,
  },
];

const twoDigits = (value) => String(value).padStart(2, "0");

export const buildDemoOrderId = (now = new Date()) => {
  const y = now.getFullYear();
  const m = twoDigits(now.getMonth() + 1);
  const d = twoDigits(now.getDate());
  const h = twoDigits(now.getHours());
  const min = twoDigits(now.getMinutes());
  const sec = twoDigits(now.getSeconds());
  return `DEMO-${y}${m}${d}-${h}${min}${sec}`;
};

export const buildDemoCdekNumber = (now = new Date()) => {
  const stamp = `${twoDigits(now.getHours())}${twoDigits(now.getMinutes())}${twoDigits(
    now.getSeconds()
  )}`;
  return `DEMO-CDEK-${stamp}`;
};
