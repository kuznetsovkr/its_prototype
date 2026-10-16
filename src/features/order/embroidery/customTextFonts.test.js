import { describe, expect, test } from "vitest";
import { CUSTOM_TEXT_FONTS, CUSTOM_TEXT_FONT_OPTIONS, DEFAULT_CUSTOM_TEXT_FONT, normalizeCustomText, normalizeCustomTextFont, getCustomTextFont, getCustomTextFontError, getCustomTextFontStyle } from "./customTextFonts";

describe("шрифты надписи", () => {
  test("offers only the eight supplied faces", () => {
    expect(CUSTOM_TEXT_FONTS).toEqual([
      "Book Antiqua", "Century Schoolbook Bold", "Lumios Marker", "Montserrat Bold",
      "Onest Bold", "Swanky and Moo Moo", "Unbounded", "Vasek Italic",
    ]);
    expect(new Set(CUSTOM_TEXT_FONTS).size).toBe(CUSTOM_TEXT_FONTS.length);
    const webFonts = CUSTOM_TEXT_FONT_OPTIONS.filter(font => font.family.startsWith("ITS Embroidery"));
    expect(webFonts).toHaveLength(8);
    expect(new Set(webFonts.map(font => font.family)).size).toBe(8);
  });

  test("uses real bold/italic faces and does not synthesize or leak an arbitrary CSS family", () => {
    expect(getCustomTextFontStyle("Montserrat Bold")).toEqual({
      fontFamily: '"ITS Embroidery Montserrat", sans-serif', fontWeight: 700, fontStyle: "normal", fontSynthesis: "none", letterSpacing: "normal",
    });
    expect(getCustomTextFontStyle("Century Schoolbook Bold").fontWeight).toBe(700);
    expect(getCustomTextFontStyle("Onest Bold").fontWeight).toBe(700);
    expect(getCustomTextFontStyle("Vasek Italic").fontStyle).toBe("italic");
    expect(getCustomTextFontStyle("Book Antiqua").fontWeight).toBe(400);
    expect(getCustomTextFontStyle("unknown-family").fontFamily).toBe('"ITS Embroidery Onest", sans-serif');
  });

  test("replaces removed or missing draft choices with an available Cyrillic font", () => {
    for (const old of [undefined, "", "Arial", "Courier New", "Georgia", "Times New Roman", "Comic Sans MS", "unknown"]) {
      expect(normalizeCustomTextFont(old)).toBe(DEFAULT_CUSTOM_TEXT_FONT);
    }
    for (const font of CUSTOM_TEXT_FONTS) expect(normalizeCustomTextFont(font)).toBe(font);
  });

  test("accepts Cyrillic and Latin in all supplied faces, including replacement Swanky", () => {
    for (const font of CUSTOM_TEXT_FONTS) {
      expect(getCustomTextFontError(font, "Привет, Ёжик! Love 2026")).toBe("");
    }
    expect(getCustomTextFont("Swanky and Moo Moo")?.label || "").not.toContain("без кириллицы");
    expect(getCustomTextFontError("CSS family", "Hello")).toBe("Выберите шрифт из списка");
  });

  test("Onest alone uses lowercase production text and minus five percent tracking", () => {
    const text = "ПрИвЕт, Ёжик! LOVE 2026\nВторая строка";
    expect(getCustomTextFontStyle("Onest Bold").letterSpacing).toBe("-0.05em");
    expect(normalizeCustomText(text, "Onest Bold")).toBe("привет, ёжик! love 2026\nвторая строка");
    expect(normalizeCustomText(undefined, "Onest Bold")).toBe("");
    expect(normalizeCustomText("", "Onest Bold")).toBe("");
    for (const font of CUSTOM_TEXT_FONTS.filter(value => value !== "Onest Bold")) {
      expect(normalizeCustomText(text, font)).toBe(text);
      expect(getCustomTextFontStyle(font).letterSpacing).toBe("normal");
    }
  });
});
