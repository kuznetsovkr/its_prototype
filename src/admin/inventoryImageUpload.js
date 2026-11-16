import api from "../api";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export const INVENTORY_UPLOAD_TIMEOUT_MS = 120_000;

export const uploadInventoryImage = async (file) => {
  if (!file || !IMAGE_TYPES.has(file.type)) throw new Error("Выберите фотографию в формате JPG, PNG или WebP");
  if (file.size < 1 || file.size > 5 * 1024 * 1024) throw new Error("Фотография должна быть не пустой и не больше 5 МБ");
  const data = new FormData();
  data.append("image", file);
  try {
    const response = await api.post("/upload", data, {
      headers: { "Content-Type": "multipart/form-data" }, timeout: INVENTORY_UPLOAD_TIMEOUT_MS,
    });
    const imageUrl = response.data?.imageUrl;
    if (typeof imageUrl !== "string" || !/^\/api\/uploads\/inventory\/[A-Za-z0-9._-]+$/.test(imageUrl)) {
      throw new Error("Сервер не подтвердил загрузку фотографии. Попробуйте ещё раз");
    }
    return imageUrl;
  } catch (error) {
    if (/timeout|timed out/i.test(error.message || "")) {
      throw new Error("Фотография не догрузилась за время ожидания. Проверьте соединение и выберите файл ещё раз");
    }
    throw error;
  }
};
