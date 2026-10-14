import { describe, expect, it } from "vitest";
import { restoreDeliveryMethod } from "./delivery";

describe("delivery draft compatibility", () => {
  it("restores old CDEK and manual drafts", () => {
    expect(restoreDeliveryMethod()).toBe("cdek");
    expect(restoreDeliveryMethod({ isNoCdek: false })).toBe("cdek");
    expect(restoreDeliveryMethod({ isNoCdek: true })).toBe("manual");
  });
  it.each(["cdek", "russian_post", "pickup", "manual"])("restores an explicit %s choice before the legacy flag", (deliveryMethod) => {
    expect(restoreDeliveryMethod({ deliveryMethod, isNoCdek: true })).toBe(deliveryMethod);
  });
  it("does not restore unsupported methods", () => {
    expect(restoreDeliveryMethod({ deliveryMethod: "courier" })).toBe("cdek");
  });
});
