import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
beforeEach(() => {
  vi.resetModules();
  sessionStorage.clear();
  vi.stubGlobal("crypto", webcrypto);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe("resumable checkout attempts", () => {
  it("uses one key for retries, including edited details while a payment may still exist", async () => {
    const api = await import("./checkout-attempt");
    const first = await api.checkoutAttemptKey({ email: "first@example.test" });
    expect(
      await api.checkoutAttemptKey({ email: "changed@example.test" }),
    ).toBe(first);
  });
  it("remembers the order access link without storing customer details", async () => {
    const api = await import("./checkout-attempt");
    const id = await api.checkoutAttemptKey({ email: "private@example.test" });
    api.rememberCheckout(id, "test-access");
    expect(api.getCheckoutAttempt()).toEqual({
      key: id,
      access: "test-access",
    });
    expect(sessionStorage.getItem("hawk-checkout-attempt")).not.toContain(
      "private@example.test",
    );
  });
  it("does not let an older receipt clear a newer checkout", async () => {
    const api = await import("./checkout-attempt");
    const id = await api.checkoutAttemptKey({});
    api.clearCheckoutAttempt("old-order-id");
    expect(api.getCheckoutAttempt()?.key).toBe(id);
    api.clearCheckoutAttempt(id);
    expect(api.getCheckoutAttempt()).toBeNull();
    expect(await api.checkoutAttemptKey({})).not.toBe(id);
  });
  it("keeps the retry key stable when browser storage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });
    const api = await import("./checkout-attempt");
    const id = await api.checkoutAttemptKey({});
    expect(await api.checkoutAttemptKey({})).toBe(id);
  });
});
