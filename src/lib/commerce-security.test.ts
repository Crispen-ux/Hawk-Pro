import { describe, it, expect } from "vitest";
import { recordSchemas } from "../../db/commerce-validation";
import { signSession, readSession } from "../../api/_lib/session";
import { emailTemplate } from "../../api/_lib/email";
import type { ApiRequest } from "../../api/_lib/http";
const req = (token: string) =>
  ({ headers: { cookie: `hawk_session=${token}` } }) as ApiRequest;
describe("commerce input safety", () => {
  it("rejects negative stock and fractional units", () => {
    expect(
      recordSchemas.inventory.safeParse({
        productId: "313b85e0-3642-45f8-8385-bf60d442219a",
        quantity: -1,
        threshold: 2,
      }).success,
    ).toBe(false);
    expect(
      recordSchemas.inventory.safeParse({
        productId: "313b85e0-3642-45f8-8385-bf60d442219a",
        quantity: 1.5,
        threshold: 2,
      }).success,
    ).toBe(false);
  });
  it("rejects invalid email and unknown order status", () => {
    expect(
      recordSchemas.orders.safeParse({
        name: "Buyer",
        email: "bad",
        productId: "313b85e0-3642-45f8-8385-bf60d442219a",
        quantity: 1,
        address: "Delivery address",
        status: "complete",
        payment: "paid",
      }).success,
    ).toBe(false);
  });
});
describe("session integrity", () => {
  it("accepts signed sessions, rejects tampering and expiration", () => {
    process.env.SESSION_SECRET = "test-secret-with-at-least-32-characters";
    const payload = {
      id: "test",
      role: "admin",
      version: 0,
      exp: Date.now() + 60000,
    };
    const token = signSession(payload);
    expect(readSession(req(token))?.role).toBe("admin");
    expect(readSession(req(token + "x"))).toBeNull();
    expect(readSession(req(signSession({ ...payload, exp: 0 })))).toBeNull();
  });
  it("escapes untrusted customer details in email", () => {
    const html = emailTemplate(
      "<script>alert(1)</script>",
      "<img src=x onerror=alert(1)>",
    );
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});
