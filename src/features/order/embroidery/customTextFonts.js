// Values are stored in orders and sent to the API; CSS aliases are local to
// the constructor so supplied faces cannot replace the site's UI typography.
export const CUSTOM_TEXT_FONT_OPTIONS = [
  { value: "Book Antiqua", family: "ITS Embroidery Book Antiqua", fallback: "serif" },
  { value: "Century Schoolbook Bold", label: "Century Schoolbook Bold", family: "ITS Embroidery Century", fallback: "serif", weight: 700 },
  { value: "Lumios Marker", family: "ITS Embroidery Lumios Marker", fallback: "cursive" },
  { value: "Montserrat Bold", family: "ITS Embroidery Montserrat", fallback: "sans-serif", weight: 700 },
  { value: "Onest Bold", family: "ITS Embroidery Onest", fallback: "sans-serif", weight: 700, lowercase: true, letterSpacing: "-0.05em" },
  { value: "Swanky and Moo Moo", family: "ITS Embroidery Swanky and Moo Moo", fallback: "cursive" },
  { value: "Unbounded", family: "ITS Embroidery Unbounded", fallback: "sans-serif" },
  { value: "Vasek Italic", family: "ITS Embroidery Vasek", fallback: "cursive", style: "italic" },
];

export const CUSTOM_TEXT_FONTS = CUSTOM_TEXT_FONT_OPTIONS.map(({ value }) => value);
export const DEFAULT_CUSTOM_TEXT_FONT = "Onest Bold";
export const getCustomTextFont = (value) => CUSTOM_TEXT_FONT_OPTIONS.find(font => font.value === value);
export const normalizeCustomTextFont = (value) => getCustomTextFont(value)?.value || DEFAULT_CUSTOM_TEXT_FONT;

// Keep the visible inscription, restored drafts and the production order equal;
// a CSS-only lowercase transform would leave uppercase letters in the order.
export const normalizeCustomText = (text, value) => {
  const input = typeof text === "string" ? text : "";
  return getCustomTextFont(normalizeCustomTextFont(value)).lowercase ? input.toLowerCase() : input;
};

export const getCustomTextFontStyle = (value) => {
  const font = getCustomTextFont(normalizeCustomTextFont(value));
  return {
    fontFamily: `"${font.family}", ${font.fallback}`,
    fontWeight: font.weight || 400,
    fontStyle: font.style || "normal",
    fontSynthesis: "none",
    letterSpacing: font.letterSpacing || "normal",
  };
};

export const getCustomTextFontError = (value) => {
  const font = getCustomTextFont(value);
  if (!font) return "Выберите шрифт из списка";
  return "";
};
