import { workPairAssets } from "../images/home/works-pairs";

const crop = (left, top, width, height) => ({ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` });

// Stable IDs link both images independently of their responsive gallery position.
// Figma: artwork 198:795, matching photo in the same slot of 207:57.
export const homeWorks = [
  { id: "tabby-cat", label: "Вышивка полосатого кота на голубом изделии", workCrop: crop(-33.26, -51.27, 141.24, 188.32), photoCrop: { objectPosition: "center bottom" } },
  { id: "mark-ii", label: "Вышивка автомобиля Toyota Mark II", photoCrop: crop(-4.85, 0, 159.89, 100) },
  { id: "black-cat", label: "Вышивка чёрного кота на сиреневом изделии", photoCrop: crop(-6.72, -35.41, 113.44, 151.3) },
  { id: "ginger-cat", label: "Вышивка рыжего кота", workCrop: crop(-12.42, -23.2, 125.05, 166.74), photoCrop: crop(-4.75, -4.48, 115.73, 115.19) },
  { id: "white-dog", label: "Вышивка белой собаки", photoCrop: crop(-54.05, -5.79, 184.76, 111.58) },
  { id: "golden-retriever", label: "Вышивка золотистого ретривера", workCrop: { objectPosition: "center top" } },
  { id: "corgi-football", label: "Вышивка корги с футбольным мячом", workCrop: crop(-100.68, -142.28, 314.73, 419.64), workMobileCrop: { left: "-100.68%", top: "50%", width: "314.73%", height: "auto", transform: "translateY(-46%)" } },
  { id: "corgi-pair", label: "Вышивка корги на чёрном и белом изделиях", photoCrop: crop(-12.89, -40.49, 143.12, 214.15) },
  { id: "merle-dog", label: "Вышивка пятнистой собаки на синем изделии", workCrop: crop(-1.9, -26.78, 137.67, 183.56) },
  { id: "skyline", label: "Вышивка автомобиля Nissan Skyline", workCrop: crop(-13.8, -40.52, 136.1, 181.47), photoCrop: crop(-27.13, -4.51, 233.97, 112.32) },
  { id: "black-dog-green", label: "Вышивка чёрной собаки на зелёном изделии" },
  { id: "chaser", label: "Вышивка автомобиля Toyota Chaser", workCrop: crop(-0.09, -83.44, 100.09, 271.86), photoCrop: crop(0, -14.67, 100, 114.59) },
  { id: "doberman", label: "Вышивка добермана", workMobileCrop: { objectPosition: "center top" }, photoCrop: crop(-11.7, -26.42, 123.97, 165.29) },
  { id: "shiba", label: "Вышивка сиба-ину" },
  { id: "spaniel", label: "Вышивка спаниеля" },
  { id: "two-dogs", label: "Вышивка двух собак" },
  { id: "volga", label: "Вышивка автомобиля Волга" },
  { id: "black-dog-purple", label: "Вышивка чёрной собаки на фиолетовом изделии", workCrop: crop(-4.09, -30.92, 108.18, 144.24) },
].map((work) => ({ ...work, ...workPairAssets[work.id] }));

const byId = Object.fromEntries(homeWorks.map((work) => [work.id, work]));
const pick = (ids) => ids.map((id) => byId[id]);

const desktopInitial = homeWorks.slice(0, 9);
const desktopAdditional = pick(["skyline", "black-dog-green", "chaser", "doberman", "shiba", "spaniel", "black-dog-purple", "two-dogs", "volga"]);
// Preserve the existing six-card mobile mosaic, but don't omit any of the
// approved works from its expanded gallery.
const mobileInitial = pick(["tabby-cat", "skyline", "black-cat", "golden-retriever", "corgi-football", "merle-dog"]);
const mobileAdditional = pick(["mark-ii", "ginger-cat", "white-dog", "corgi-pair", "shiba", "spaniel", "black-dog-purple", "two-dogs", "volga", "black-dog-green", "chaser", "doberman"]);

export const getHomeWorks = (breakpoint) => ({
  initialItems: breakpoint === "mobile" ? mobileInitial : desktopInitial,
  additionalItems: breakpoint === "mobile" ? mobileAdditional : desktopAdditional,
});
