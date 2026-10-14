import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { customerTabs } from "../../data/homeContent";
import { customerAssets } from "../../images/home/customers";
import CustomersSection from "./CustomersSection";

vi.mock("./useScrollZoom", () => ({ default: () => null }));

describe("approved customer slides", () => {
  it("maps all five tabs to distinct, local, non-empty WebP photos at every breakpoint", () => {
    expect(Object.keys(customerAssets)).toEqual(customerTabs.map((tab) => tab.id));
    for (const breakpoint of ["desktop", "tablet", "mobile"]) {
      expect(new Set(customerTabs.map((tab) => customerAssets[tab.id][breakpoint])).size).toBe(5);
    }
    for (const tab of customerTabs) {
      expect(tab.photoAlt).toBeTruthy();
      for (const suffix of ["", "-mobile"]) {
        const file = readFileSync(new URL(`../../images/home/customers/${tab.id}${suffix}.webp`, import.meta.url));
        expect(file.length).toBeGreaterThan(0);
        expect(file.subarray(0, 4).toString()).toBe("RIFF");
        expect(file.subarray(8, 12).toString()).toBe("WEBP");
      }
    }
  });

  it("renders keyboard-accessible tabs and each tab's own photo, heading and paragraphs", () => {
    const html = renderToStaticMarkup(<CustomersSection assets={customerAssets} />);
    expect(html.match(/role="tab"/g)).toHaveLength(5);
    expect(html.match(/role="tabpanel"/g)).toHaveLength(5);
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(html.match(/ hidden=""/g)).toHaveLength(4);
    for (const tab of customerTabs) {
      expect(html).toContain(`home-customers__content--${tab.id}`);
      expect(html).toContain(`src="${customerAssets[tab.id].desktop}"`);
      expect(html).toContain(`srcSet="${customerAssets[tab.id].mobile}"`);
      expect(html).toContain(`alt="${tab.photoAlt}"`);
      expect(html).toContain(tab.title);
      expect(html).toContain(tab.paragraphs[0]);
    }
  });

  it("uses the new care and wholesale copy without publishing draft notes or promising an immediate tracking code", () => {
    const byId = Object.fromEntries(customerTabs.map((tab) => [tab.id, tab]));
    expect(byId.care.title).toBe("Уход за изделием:");
    expect(byId.care.paragraphs.join("\n")).toContain("до 150°C");
    expect(byId.care.paragraphs[1].split("\n")).toHaveLength(7);
    expect(byId.wholesale.paragraphs.join("\n")).toContain("Минимальный тираж — от 10 изделий");
    const text = customerTabs.flatMap((tab) => tab.paragraphs).join("\n");
    expect(text).not.toContain("также как у паталахас");
    expect(text).not.toContain("И можно добавить пункт");
    expect(text).not.toContain("Ссылка на тг, вк, инст");
    expect(text).not.toContain("После оформления заказа на сайте, вам будет выслан трек");
  });
});
