import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RecipientDeliveryFields from "./RecipientDeliveryFields";
import { demoDeliveryCity } from "./deliveryCity";

const props = { city: demoDeliveryCity(), deliveryMethod: "cdek", postalPoint: "", deliveryRecipient: "", recipientPhone: "", deliveryComment: "" };
describe("RecipientDeliveryFields", () => {
  it("provides a city combobox and three accessible choices for Krasnoyarsk", () => {
    const html = renderToStaticMarkup(<RecipientDeliveryFields {...props} />);
    expect(html.match(/type="radio"/g)).toHaveLength(3);
    expect(html).toContain('aria-label="Способ получения"');
    expect(html).toContain('aria-label="СДЭК"');
    expect(html).toContain('aria-label="Почта России"');
    expect(html).toContain('aria-label="Самовывоз"');
    expect(html).toContain("Город получения");
    expect(html).toContain('role="combobox"');
  });
  it("hides pickup outside Krasnoyarsk and disables methods until a city is chosen", () => {
    const html = renderToStaticMarkup(<RecipientDeliveryFields {...props} city={{ ...props.city, name: "Москва", pickup: false }} />);
    expect(html).not.toContain('aria-label="Самовывоз"');
    const empty = renderToStaticMarkup(<RecipientDeliveryFields {...props} city={null} />);
    expect(empty).toContain('aria-label="Способ получения" disabled');
    expect(empty).not.toContain('aria-label="Самовывоз"');
  });
  it("uses the agreed pickup address and individual timing, not mock opening hours", () => {
    const html = renderToStaticMarkup(<RecipientDeliveryFields {...props} deliveryMethod="pickup" />);
    expect(html).toContain("Ломоносова, 11");
    expect(html).toContain("Время по согласованию");
    expect(html).not.toContain("10:30");
    expect(html).not.toContain("shipping tel");
    expect(html).not.toContain("Выберите пункт получения СДЭК");
  });
  it("clearly marks postal selection as manual and preserves the other-recipient phone", () => {
    const html = renderToStaticMarkup(<RecipientDeliveryFields {...props} deliveryMethod="russian_post" />);
    expect(html).toContain("Индекс и адрес отделения");
    expect(html).toContain("Пока укажите отделение вручную");
    expect(html).toContain('maxLength="241"');
    expect(html).toContain("Телефон другого получателя");
    expect(html).not.toContain("Выберите пункт получения СДЭК");
    expect(html).not.toContain("от 300");
  });
});
