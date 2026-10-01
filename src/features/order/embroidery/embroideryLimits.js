export const MAX_PATRONUS_COUNT = 4;
export const MAX_PET_FACE_COUNT = 5;

export const getPatronusLimit = (profile) => {
  const configured = Number(profile?.patronusLimit);
  return Number.isInteger(configured) && configured > 0
    ? Math.min(configured, MAX_PATRONUS_COUNT)
    : MAX_PATRONUS_COUNT;
};

export const getEmbroideryCountError = ({ type, patronusCount, petFaceCount, patronusLimit }) => {
  if (type === "Patronus") {
    if (!Number.isInteger(patronusCount) || patronusCount < 1) {
      return "Укажите количество патронусов";
    }
    if (patronusCount > patronusLimit) {
      return `Для выбранного изделия доступно не более ${patronusLimit} патронусов`;
    }
  }
  if (type === "petFace") {
    if (!Number.isInteger(petFaceCount) || petFaceCount < 1) {
      return "Укажите количество портретов питомца";
    }
    if (petFaceCount > MAX_PET_FACE_COUNT) {
      return `Можно заказать не более ${MAX_PET_FACE_COUNT} портретов питомца`;
    }
  }
  return "";
};
