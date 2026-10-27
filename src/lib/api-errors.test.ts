import { afterEach, describe, it, expect, vi } from "vitest";
import { apiErrorMessage, request } from "./api";
afterEach(() => vi.unstubAllGlobals());
describe("API error responses", () => {
  it("reads string errors and nested platform error messages", () => {
    expect(
      apiErrorMessage({ error: "Email or password is incorrect" }, 401),
    ).toBe("Email or password is incorrect");
    expect(
      apiErrorMessage(
        { error: { message: "The service could not be reached" } },
        500,
      ),
    ).toBe("The service could not be reached");
  });
  it("never stringifies unknown objects into the user interface", () => {
    expect(
      apiErrorMessage({ error: { code: "FUNCTION_INVOCATION_FAILED" } }, 500),
    ).toBe("The service is temporarily unavailable. Please try again shortly.");
    expect(apiErrorMessage({ error: {} }, 400)).not.toContain(
      "[object Object]",
    );
    expect(apiErrorMessage({ error: null }, 400)).toContain(
      "Request failed (400)",
    );
  });
  it("preserves structured payloads for callers while presenting a readable message", async () => {
    const payload = {
      error: {
        message: "Email delivery is not configured",
        code: "EMAIL_UNAVAILABLE",
      },
    };
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify(payload), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }),
        ),
    );
    await expect(request("/api/account")).rejects.toMatchObject({
      message: "Email delivery is not configured",
      status: 503,
      payload,
    });
  });
  it("handles plain-text function startup failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("FUNCTION_INVOCATION_FAILED", { status: 500 }),
        ),
    );
    await expect(request("/api/account")).rejects.toMatchObject({
      message:
        "The service is temporarily unavailable. Please try again shortly.",
      status: 500,
    });
  });
});
