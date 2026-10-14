import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import EmbroideryDesktop from "./EmbroideryDesktop";

const noop = () => {};
const renderInstructions = (selectedType, desktopTab = "image") => {
  const selection = {
    clothingPreviewSrc: "",
    clothingPreviewAlt: "",
    selectedType,
    customText: "",
    setCustomText: noop,
    uploadedImage: [],
    comment: "",
    setComment: noop,
    error: "",
    patronusCount: 1,
    setPatronusCount: noop,
    petFaceCount: 1,
    setPetFaceCount: noop,
    customTextFont: "Arial",
    setCustomTextFont: noop,
    patronusLimit: 4,
    hasFiles: false,
    canProceed: false,
    disabledHint: "",
    priceError: "",
    desktopPriceLabel: "",
    handleFileChange: noop,
    handleFileDragOver: noop,
    handleFileDrop: noop,
    handleRemoveImage: noop,
    missingUploadFiles: [],
    dismissMissingUploadFiles: noop,
  };
  const markup = renderToStaticMarkup(
    <EmbroideryDesktop
      selection={selection}
      desktopTab={desktopTab}
      desktopDetailsOpen={desktopTab === "image"}
      isUploadStage={desktopTab === "image"}
      fileInputRef={{ current: null }}
      onImageTab={noop}
      onTextTab={noop}
      onTypeSelect={noop}
      onBack={noop}
      onNext={noop}
    />
  );
  return markup.match(/<div class="embroideryUploadStage__instructions">([\s\S]*?)<\/div>/)?.[1] || "";
};

describe("embroidery upload instructions", () => {
  test("custom image instructions replace the previous type's text and do not leak to other types", () => {
    const instruction = "Отправьте, пожалуйста, фотографию, которую хотите вышить и/или опишите вашу идею";
    for (const selectedType of ["Patronus", "custom", "Car", "petFace", "custom", "Patronus"]) {
      const markup = renderInstructions(selectedType);
      if (selectedType === "custom") {
        expect(markup.match(/<p>/g)).toHaveLength(1);
        expect(markup).toContain(instruction);
        expect(markup).not.toContain("фото вашего питомца");
        expect(markup).not.toContain("фотографию вашего автомобиля");
        expect(markup).not.toContain("Для вышивки мордочки питомца");
        expect(markup).not.toContain("1000 руб");
      } else {
        expect(markup).not.toContain(instruction);
      }
    }
  });

  test("the custom text tab does not show image upload instructions", () => {
    expect(renderInstructions("custom", "text")).toBe("");
  });

  test("renders car paragraphs and replaces them when the selected type changes", () => {
    const car = renderInstructions("Car");
    const petFace = renderInstructions("petFace");
    expect(car.match(/<p>/g)).toHaveLength(4);
    expect(car).toContain("фотографию вашего автомобиля");
    expect(car).not.toContain("мордочки питомца");
    expect(petFace.match(/<p>/g)).toHaveLength(1);
    expect(petFace).toContain("Для вышивки мордочки питомца");
    expect(petFace).not.toContain("автомобиля");
  });
});
