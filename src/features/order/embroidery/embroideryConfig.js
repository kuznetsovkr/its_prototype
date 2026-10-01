export const EMBROIDERY_TYPES = [
  { value: "Patronus", label: "патронусы", hasExample: true },
  { value: "Car", label: "автомобиль", hasExample: true },
  { value: "petFace", label: "мордочка питомца", hasExample: true },
  { value: "custom", label: "другая", hasExample: false },
];

export const CUSTOM_TEXT_FONTS = [
  "Arial",
  "Courier New",
  "Georgia",
  "Times New Roman",
  "Comic Sans MS",
];

export const UPLOAD_INSTRUCTIONS = [
  "Отправьте, пожалуйста, фото вашего питомца:",
  "1. Одно из фото должно быть мордочкой животного, которую Вы бы хотели видеть на эскизе.",
  "2. Фото, на которых полностью видно окрас тела, лапы, хвост.",
  "3.Если у Вашего питомца есть какая-либо особенность во внешности, а также есть атрибутика (например, ошейник), которые Вы хотели бы видеть, пожалуйста, укажите это.",
  "Если нужна конкретная поза, то отправьте картинку-пример или подробно опишите ее. Если конкретных пожеланий по позе нет, то отправьте несколько вариантов, которые вам нравятся, и от которых может отталкиваться художник",
  "Также, хотим предупредить, что полностью изменить позу на уже готовом эскизе возможно за доп.плату 1000 руб",
];

export const UPLOAD_INSTRUCTIONS_BY_TYPE = {
  Patronus: UPLOAD_INSTRUCTIONS,
  Car: [
    "Отправьте, пожалуйста, фотографию вашего автомобиля.",
    "Выберите фото с того ракурса, с которого хотите видеть автомобиль на вышивке.",
    "Если хотите вышивку с определённой стороны, ракурса или в конкретном положении колёс — отправьте фото, на котором это хорошо видно.",
    "Если хотите добавить надпись, фон, номер, логотип или другие детали, пожалуйста, укажите это вместе с фотографией",
  ],
  petFace: [
    "Для вышивки мордочки питомца отправьте отдельное фото с выражением мордочки, которое хотите видеть на вышивке. Мы будем ориентироваться именно на это фото при создании эскиза",
  ],
  custom: UPLOAD_INSTRUCTIONS,
};

export const getUploadInstructions = (type) => UPLOAD_INSTRUCTIONS_BY_TYPE[type] || [];

export const MAX_UPLOAD_MB = 5;
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const isSameFiles = (left = [], right = []) =>
  left === right || (Array.isArray(left) && Array.isArray(right) && left.length === right.length &&
    left.every((file, index) => file === right[index]));

export const isSameOptions = (left = {}, right = {}) =>
  (left?.image ?? false) === (right?.image ?? false) &&
  (left?.text ?? false) === (right?.text ?? false);

export const selectUploadFiles = ({ currentFiles, incomingFiles, selectedType }) => {
  const limit = selectedType === "petFace" ? 5 : 10;
  const makeKey = (file) => `${file.name}_${file.size}_${file.lastModified}`;
  const existingKeys = new Set(currentFiles.map(makeKey));
  const accepted = [];
  const rejected = { duplicate: [], type: [], size: [] };

  incomingFiles.forEach((file) => {
    const key = makeKey(file);
    if (existingKeys.has(key)) rejected.duplicate.push(file.name);
    else if (!ALLOWED_IMAGE_TYPES.includes(file.type)) rejected.type.push(file.name);
    else if (file.size > MAX_UPLOAD_MB * 1024 * 1024) rejected.size.push(file.name);
    else accepted.push(file);
  });

  const remaining = Math.max(0, limit - currentFiles.length);
  const filesToAdd = accepted.slice(0, remaining);
  const messages = [];
  if (rejected.duplicate.length) messages.push(`Дубликаты: ${rejected.duplicate.join(", ")}`);
  if (rejected.type.length) messages.push(`Неподдерживаемый тип: ${rejected.type.join(", ")}`);
  if (rejected.size.length) messages.push(`Слишком большие файлы (> ${MAX_UPLOAD_MB} МБ): ${rejected.size.join(", ")}`);
  if (accepted.length > remaining) messages.push(`Превышен лимит (${limit}). Добавлено: ${filesToAdd.length}`);

  return { files: [...currentFiles, ...filesToAdd], error: messages.join(" • ") };
};
