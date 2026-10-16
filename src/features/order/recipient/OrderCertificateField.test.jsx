import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import OrderCertificateField, { isCertificateConfirmed } from "./OrderCertificateField";

const code = "ITS" + "A1".repeat(16);
const props = { certificate: { input: code, appliedCode: code }, quote: { appliedCertificateCode: code, certificateDiscount: 5000 } };

test("shows successful application only for a matching confirmed server quote", () => {
  expect(isCertificateConfirmed(props)).toBe(true);
  expect(renderToStaticMarkup(<OrderCertificateField {...props} />)).toContain('role="status">Промокод применён.');
  for (const extra of [
    { loading: true }, { quoteError: "Код истёк" }, { manual: true }, { demo: true }, { quote: null },
    { quote: { ...props.quote, certificateDiscount: 0 } }, { quote: { ...props.quote, appliedCertificateCode: "old" } },
    { certificate: { ...props.certificate, hasUnappliedCode: true } },
    { certificate: { ...props.certificate, appliedCode: "" } }, { certificate: { ...props.certificate, error: "Неверный код" } },
  ]) {
    expect(isCertificateConfirmed({ ...props, ...extra })).toBe(false);
    expect(renderToStaticMarkup(<OrderCertificateField {...props} {...extra} />)).not.toContain("Промокод применён.");
  }
});
