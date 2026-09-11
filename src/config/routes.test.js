import { describe, expect, it } from "vitest";
import {
  ORDER_FLOW_PATHS,
  PUBLIC_APP_PATHS,
  isOrderFlowPath,
  normalizeAppPath,
} from "./routes";

describe("public application routes", () => {
  it("keeps the real payment result routes in the order flow", () => {
    expect(ORDER_FLOW_PATHS).toContain("/payment-success");
    expect(ORDER_FLOW_PATHS).toContain("/payment-fail");
  });

  it("does not expose retired payment simulators", () => {
    expect(PUBLIC_APP_PATHS).not.toContain("/payment");
    expect(PUBLIC_APP_PATHS).not.toContain("/fake-payment");
  });

  it("normalizes trailing slashes without accepting route prefixes", () => {
    expect(normalizeAppPath("/order///")).toBe("/order");
    expect(isOrderFlowPath("/order/")).toBe(true);
    expect(isOrderFlowPath("/order-unexpected")).toBe(false);
  });
});
