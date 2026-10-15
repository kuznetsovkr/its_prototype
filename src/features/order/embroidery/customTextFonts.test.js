import { describe, expect, test } from "vitest";
import { CUSTOM_TEXT_FONTS, CUSTOM_TEXT_FONT_OPTIONS, DEFAULT_CUSTOM_TEXT_FONT, normalizeCustomTextFont, getCustomTextFontError, getCustomTextFontStyle } from "./customTextFonts";

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
      fontFamily: '"ITS Embroidery Montserrat", sans-serif', fontWeight: 700, fontStyle: "normal", fontSynthesis: "none",
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

  test("reports Cyrillic in the Latin face without changing or transliterating the user's text", () => {
    expect(getCustomTextFontError("Swanky and Moo Moo", "Love 2026!")).toBe("");
    expect(getCustomTextFontError("Swanky and Moo Moo", "")).toBe("");
    for (const text of ["Любовь", "Aя", "Ё", "Ї"]) {
      expect(getCustomTextFontError("Swanky and Moo Moo", text)).toContain("не поддерживает кириллицу");
    }
    for (const font of CUSTOM_TEXT_FONTS.filter(value => value !== "Swanky and Moo Moo")) {
      expect(getCustomTextFontError(font, "Привет, Ёжик! Love 2026")).toBe("");
    }
    expect(getCustomTextFontError("CSS family", "Hello")).toBe("Выберите шрифт из списка");
  });
});
