import { expect, test } from "vitest";
import { ACKNOWLEDGEMENT_KEY, acknowledgeNotice, isCurrentNotice, isNoticePage, readAcknowledgement } from "./noticeState";

test("notice excludes certificate, admin, legal and payment return routes", () => {
  for (const path of ["/", "/order", "/embroidery/", "/recipient"]) expect(isNoticePage(path)).toBe(true);
  for (const path of ["/certificate", "/admin", "/admin/inventory", "/payment-success", "/payment-fail", "/privacy", "/offer", "/thank-you"]) expect(isNoticePage(path)).toBe(false);
});
test("session acknowledgement is content-versioned and survives disabled storage", () => {
  const values = new Map();
  const storage = () => ({ getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) });
  expect(readAcknowledgement(storage)).toBe("");
  acknowledgeNotice(storage, "version-one");
  expect(values.get(ACKNOWLEDGEMENT_KEY)).toBe("version-one");
  expect(readAcknowledgement(storage)).toBe("version-one");
  const blocked = () => { throw new Error("SecurityError"); };
  expect(readAcknowledgement(blocked)).toBe("");
  expect(() => acknowledgeNotice(blocked, "one")).not.toThrow();
});
test("expired automatic notice cannot continue to display an old batch", () => {
  const notice = { enabled: true, version: "v1", text: "Срок", nextChangeAt: "2026-11-14T17:00:00Z" };
  expect(isCurrentNotice(notice, Date.parse("2026-11-14T16:59:59Z"))).toBe(true);
  expect(isCurrentNotice(notice, Date.parse("2026-11-14T17:00:00Z"))).toBe(false);
  expect(isCurrentNotice({ ...notice, enabled: false }, 0)).toBe(false);
  expect(isCurrentNotice({ ...notice, nextChangeAt: null }, Date.parse("2028-01-01"))).toBe(true);
});
