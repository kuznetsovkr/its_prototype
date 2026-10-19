import { MAX_PATRONUS_COUNT, MAX_PET_FACE_COUNT } from "../order/embroidery/embroideryLimits";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_MB } from "../order/embroidery/embroideryConfig";
import { isCartId } from "./cartStorage";
import { normalizeCarDesign } from "../order/embroidery/carDesigns";

export const createCartItemKey = () => crypto.randomUUID();

export const buildCartItemFormData = (draft, { requestKey, turnstileToken = "" } = {}) => {
  if (!isCartId(requestKey)) throw new Error("Для добавления изделия нужен идентификатор позиции");
  const { clothing = {}, embroidery = {} } = draft || {};
  if (draft?.recipient?.privacyConsent !== true) throw new Error("Для сохранения фотографий необходимо согласие на обработку данных");
  const productType = typeof clothing.type === "object" ? clothing.type?.name || clothing.type?.type : clothing.type;
  if (!productType || !clothing.color || !clothing.size) throw new Error("Выберите изделие, цвет и размер");
  if (embroidery.type === "custom") throw new Error("Индивидуальную вышивку нужно оформить отдельной заявкой");
  if (!["Patronus", "Car", "petFace"].includes(embroidery.type) || embroidery.typeSelectionExplicit === false) {
    throw new Error("Выберите тип вышивки");
  }
  const patronusCount = embroidery.type === "Patronus" ? Number(embroidery.patronusCount ?? 1) : 1;
  if (embroidery.type === "Car" && !normalizeCarDesign(embroidery.carDesign)) throw new Error("Выберите сложность дизайна автомобиля");
  if (embroidery.type === "Car" && embroidery.carDesign === "complex" && clothing.profile?.code === "tshirt") throw new Error("Сложный дизайн автомобиля не предлагается для футболки");
  const petFaceCount = embroidery.type === "petFace" ? Number(embroidery.petFaceCount ?? 1) : 1;
  const patronusLimit = Math.min(MAX_PATRONUS_COUNT, Number(clothing.profile?.patronusLimit ?? MAX_PATRONUS_COUNT));
  if (!Number.isInteger(patronusCount) || patronusCount < 1 || patronusCount > patronusLimit) {
    throw new Error(`Для выбранного изделия доступно не более ${patronusLimit} патронусов`);
  }
  if (!Number.isInteger(petFaceCount) || petFaceCount < 1 || petFaceCount > MAX_PET_FACE_COUNT) {
    throw new Error(`Можно заказать не более ${MAX_PET_FACE_COUNT} мордочек питомца`);
  }
  const files = embroidery.uploadedImage;
  const limit = embroidery.type === "petFace" ? 5 : 10;
  if (!Array.isArray(files) || !files.length || files.length > limit) throw new Error(`Загрузите от 1 до ${limit} фотографий для вышивки`);
  for (const file of files) {
    if (!(file instanceof Blob) || !ALLOWED_IMAGE_TYPES.includes(file.type) || file.size < 1 || file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      throw new Error("Допустимы фотографии JPEG, PNG и WebP размером до 5 МБ");
    }
  }
  const comment = String(embroidery.comment || "").trim();
  if (comment.length > 2500) throw new Error("Комментарий должен содержать не более 2500 символов");
  const formData = new FormData();
  Object.entries({ productType, color: clothing.color, size: clothing.size, embroideryType: embroidery.type,
    patronusCount, petFaceCount, comment, turnstileToken, privacyConsent: true }).forEach(([key, value]) => formData.append(key, String(value)));
  if (embroidery.type === "Car") formData.append("carDesign", embroidery.carDesign);
  files.forEach((file, index) => formData.append("images", file, file.name || `image-${index + 1}`));
  return formData;
};
