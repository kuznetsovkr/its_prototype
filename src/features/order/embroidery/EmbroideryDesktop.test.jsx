import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import EmbroideryDesktop from "./EmbroideryDesktop";

const noop = () => {};
const renderInstructions = (selectedType) => {
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
      desktopTab="image"
      desktopDetailsOpen
      isUploadStage
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
