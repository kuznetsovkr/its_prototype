import { describe, expect, it } from "vitest";
import { getOrderCompletionContent } from "./orderCompletionContent";

describe("order completion content", () => {
  it("shows the paid design and receipt text when a buyer email was provided", () => {
    expect(getOrderCompletionContent({ receiptEmailProvided: true })).toEqual({
      title: "спасибо за заказ",
      manual: false,
      paragraphs: [
        "Заказ успешно оплачен! Чек придёт вам на почту",
        "В ближайшее время мы свяжемся с вами и пришлём эскиз на утверждение",
      ],
    });
  });

  it.each([undefined, false, "true"])("does not promise a receipt without an explicit email flag: %s", (flag) => {
    const content = getOrderCompletionContent({ receiptEmailProvided: flag });
    expect(content.paragraphs[0]).toBe("Заказ успешно оплачен!");
    expect(content.paragraphs.join(" ")).not.toContain("почту");
  });

  it("confirms an individual request without claiming payment or email delivery", () => {
    expect(getOrderCompletionContent({ manual: true, requestKind: "individual", receiptEmailProvided: true })).toEqual({
      title: "заявка оформлена",
      manual: true,
      paragraphs: ["В ближайшее время мы свяжемся с вами и уточним детали индивидуальной вышивки"],
    });
  });

  it.each(["delivery", undefined])("retains the generic message for other manual requests: %s", (requestKind) => {
    const content = getOrderCompletionContent({ manual: true, requestKind });
    expect(content.title).toBe("заявка оформлена");
    expect(content.paragraphs[0]).toContain("расчёта стоимости");
    expect(content.paragraphs[0]).not.toContain("индивидуальной вышивки");
  });
});
