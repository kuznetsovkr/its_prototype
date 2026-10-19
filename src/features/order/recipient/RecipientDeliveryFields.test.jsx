import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RecipientDeliveryFields from "./RecipientDeliveryFields";
import { demoDeliveryCity } from "./deliveryCity";

const props = { city: demoDeliveryCity(), deliveryMethod: "cdek", postalPoint: "", deliveryRecipient: "", recipientPhone: "", deliveryComment: "" };
describe("RecipientDeliveryFields", () => {
  it("allows postal checkout for a cart while keeping unapproved pickup disabled", () => {
    const html = renderToStaticMarkup(<RecipientDeliveryFields {...props} cartCheckout deliveryMethod="russian_post" />);
    expect(html).toMatch(/aria-label="Почта России" checked/);
    expect(html).toMatch(/aria-label="Самовывоз" disabled/);
    expect(html).toContain("Для корзины доступны СДЭК и Почта России");
  });
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
    expect(html).toContain("Укажите индекс и адрес отделения");
    expect(html).toContain("Доставка оплачивается отдельно после изготовления заказа");
    expect(html).toContain("Менеджер сообщит фактическую стоимость и отправит чек");
    expect(html).not.toContain("стоимость доставки перед оплатой");
    expect(html).toContain('maxLength="241"');
    expect(html).toContain("Получатель — другой человек");
    expect(html).not.toContain("Телефон другого получателя");
    expect(html).not.toContain("Выберите пункт получения СДЭК");
    expect(html).not.toContain("от 300");
  });
  it("does not show postal payment terms for the other delivery methods", () => {
    for (const deliveryMethod of ["cdek", "pickup"]) {
      const html = renderToStaticMarkup(<RecipientDeliveryFields {...props} deliveryMethod={deliveryMethod} />);
      // The method choice stays informative, but the detailed postal notice is
      // only shown when the customer actually selects Russian Post.
      expect(html).not.toContain("Менеджер сообщит фактическую стоимость и отправит чек");
      expect(html).not.toContain('id="recipient-postal-help"');
    }
  });
  it("shows required recipient fields only when the checkbox is enabled; restores legacy filled fields", () => {
    const shown = renderToStaticMarkup(<RecipientDeliveryFields {...props} hasOtherRecipient />);
    expect(shown).toContain('id="other-recipient-fields"');
    expect(shown.match(/required=""/g)).toHaveLength(2);
    expect(shown).toContain("Укажите корректный телефон получателя");
    const legacy = renderToStaticMarkup(<RecipientDeliveryFields {...props} deliveryRecipient="Петров Пётр" />);
    expect(legacy).toContain("Телефон другого получателя");
    expect(legacy).toContain('checked=""');
    const pickup = renderToStaticMarkup(<RecipientDeliveryFields {...props} deliveryMethod="pickup" hasOtherRecipient />);
    expect(pickup).not.toContain("other-recipient-fields");
  });
});
