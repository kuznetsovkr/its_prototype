import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import EmbroideryDesktop from "./EmbroideryDesktop";

const noop = () => {};
const renderPanel = (selectedType, desktopTab = "image", overrides = {}) => {
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
    customTextFont: "Onest Bold",
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
    ...overrides,
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
  return markup;
};
const renderInstructions = (selectedType, desktopTab = "image") => renderPanel(selectedType, desktopTab)
  .match(/<div class="embroideryUploadStage__instructions">([\s\S]*?)<\/div>/)?.[1] || "";

describe("inscription font preview", () => {
  test("renders supplied choices and the actual selected face", () => {
    const bold = renderPanel("custom", "text", { customTextFont: "Montserrat Bold", customText: "Привет" });
    expect(bold.match(/<option /g)).toHaveLength(8);
    for (const old of ["Arial", "Georgia", "Courier New", "Comic Sans MS", "Times New Roman"]) expect(bold).not.toContain('value="' + old + '"');
    expect(bold).toContain("ITS Embroidery Montserrat");
    expect(bold).toContain("font-weight:700");
    expect(bold).toContain('value="Montserrat Bold" selected=""');
    expect(bold).toContain('value="Swanky and Moo Moo">Swanky and Moo Moo</option>');
    expect(bold).not.toContain("без кириллицы");
    expect(renderPanel("custom", "text", { customTextFont: "Vasek Italic" })).toContain("font-style:italic");
    expect(renderPanel("custom", "text")).toContain("letter-spacing:-0.05em");
  });
  test("makes an invalid font/text combination visible and disables proceeding", () => {
    const markup = renderPanel("custom", "text", { customTextFont: "Unknown Font", customText: "Привет", fontError: "Выберите шрифт из списка" });
    expect(markup).toContain('aria-describedby="embroidery-font-error"');
    expect(markup).toContain('id="embroidery-font-error" role="alert"');
    expect(markup).toContain('disabled="" title=""');
  });
});

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
