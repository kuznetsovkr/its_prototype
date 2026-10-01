import { describe, expect, test } from "vitest";
import {
  EMBROIDERY_TYPES,
  getUploadInstructions,
  selectUploadFiles,
  UPLOAD_INSTRUCTIONS,
} from "./embroideryConfig";

const image = (name, overrides = {}) => ({
  name,
  size: 1024,
  type: "image/jpeg",
  lastModified: 1,
  ...overrides,
});

describe("embroidery uploads", () => {
  test("keeps valid files and reports invalid ones", () => {
    const result = selectUploadFiles({
      currentFiles: [image("saved.jpg")],
      incomingFiles: [
        image("saved.jpg"),
        image("new.webp", { type: "image/webp", lastModified: 2 }),
        image("document.pdf", { type: "application/pdf", lastModified: 3 }),
      ],
      selectedType: "Patronus",
    });

    expect(result.files.map((file) => file.name)).toEqual(["saved.jpg", "new.webp"]);
    expect(result.error).toContain("Дубликаты: saved.jpg");
    expect(result.error).toContain("Неподдерживаемый тип: document.pdf");
  });
});

describe("upload instructions", () => {
  test("uses the exact domain type keys and preserves existing instructions for other types", () => {
    expect(EMBROIDERY_TYPES.map(({ value }) => value)).toEqual([
      "Patronus", "Car", "petFace", "custom",
    ]);
    expect(getUploadInstructions("Patronus")).toBe(UPLOAD_INSTRUCTIONS);
    expect(getUploadInstructions("custom")).toBe(UPLOAD_INSTRUCTIONS);
    expect(getUploadInstructions("unknown")).toEqual([]);
  });

  test("keeps the car and pet-face paragraphs separate without previous-type text", () => {
    expect(getUploadInstructions("Car")).toEqual([
      "Отправьте, пожалуйста, фотографию вашего автомобиля.",
      "Выберите фото с того ракурса, с которого хотите видеть автомобиль на вышивке.",
      "Если хотите вышивку с определённой стороны, ракурса или в конкретном положении колёс — отправьте фото, на котором это хорошо видно.",
      "Если хотите добавить надпись, фон, номер, логотип или другие детали, пожалуйста, укажите это вместе с фотографией",
    ]);
    expect(getUploadInstructions("petFace")).toEqual([
      "Для вышивки мордочки питомца отправьте отдельное фото с выражением мордочки, которое хотите видеть на вышивке. Мы будем ориентироваться именно на это фото при создании эскиза",
    ]);
    expect(getUploadInstructions("Car").join(" ")).not.toContain("мордочки питомца");
    expect(getUploadInstructions("petFace").join(" ")).not.toContain("автомобиля");
  });
});
