import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { socialLinks } from "../../../data/homeContent";
import OrderCompletionPanel from "./OrderCompletionPanel";
import { getOrderCompletionContent } from "./orderCompletionContent";

describe("OrderCompletionPanel", () => {
  it("uses the individual-request design and never retains the paid message", () => {
    const html = renderToStaticMarkup(<OrderCompletionPanel content={getOrderCompletionContent({ manual: true, requestKind: "individual" })} />);
    expect(html).toContain("thx__content--manual");
    expect(html).toContain("заявка оформлена");
    expect(html).toContain("детали индивидуальной вышивки");
    expect(html).not.toContain("успешно оплачен");
    expect(html).not.toContain("Чек");
    expect(html).toContain('id="thx-title"');
    expect(html).toContain('tabindex="-1"');
  });

  it("reuses site contact addresses with accessible links and local design assets", () => {
    const html = renderToStaticMarkup(<OrderCompletionPanel content={getOrderCompletionContent()} />);
    expect(html.match(/class="thx__socialLink"/g)).toHaveLength(3);
    expect(html).toContain('aria-label="Связаться с нами"');
    for (const [key, label] of [["instagram", "Instagram"], ["telegram", "Telegram"], ["vk", "ВКонтакте"]]) {
      expect(html).toContain(`href="${socialLinks[key]}"`);
      expect(html).toContain(`aria-label="${label} — связаться с нами"`);
    }
    const sources = [...html.matchAll(/<img src="([^"]+)"/g)].map((match) => match[1]);
    expect(sources).toHaveLength(3);
    expect(sources.every((src) => src.startsWith("data:image/svg+xml,") || src.startsWith("/"))).toBe(true);
    expect(html.match(/rel="noopener noreferrer"/g)).toHaveLength(3);
    expect(html).not.toContain("figma.com");
  });
});
