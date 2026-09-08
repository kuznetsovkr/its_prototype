import { selectUploadFiles } from "./embroideryConfig";

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
