import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { safePayflexRedirect } from "../../api/_lib/payflex-client";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("Payflex redirect safety", () => {
  it("accepts hosted Payflex checkout URLs", () => {
    expect(
      safePayflexRedirect("https://checkout.payflex.co.za/checkout?token=test"),
    ).toContain("checkout.payflex.co.za");
  });
  it.each([
    "http://checkout.payflex.co.za",
    "https://checkout.payflex.co.za.evil.example",
    "https://evilpayflex.co.za",
    "javascript:alert(1)",
  ])("rejects untrusted payment redirect %s", (url) => {
    expect(() => safePayflexRedirect(url)).toThrow();
  });
});
describe("Payflex hosted checkout client", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("PAYFLEX_CLIENT_ID", "test-client");
    vi.stubEnv("PAYFLEX_CLIENT_SECRET", "test-secret");
    vi.stubEnv("PAYFLEX_ENVIRONMENT", "sandbox");
  });
  it("uses sandbox authentication and sends the documented order shape", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "test-token", expires_in: 3600 }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            orderId: "2f549b62-5e66-4f2e-8c7c-f5497fa17142",
            redirectUrl:
              "https://checkout.uat.payflex.co.za/checkout?token=test",
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetcher);
    const api = await import("../../api/_lib/payflex-client");
    await api.createPayflexOrder({ amount: 100, merchantReference: "test" });
    expect(fetcher.mock.calls[0][0]).toBe(
      "https://auth-uat.payflex.co.za/auth/merchant",
    );
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toMatchObject({
      grant_type: "client_credentials",
      audience: "https://auth-dev.payflex.co.za",
    });
    expect(fetcher.mock.calls[1][0]).toBe(
      "https://api.uat.payflex.co.za/order",
    );
    expect(fetcher.mock.calls[1][1].headers.Authorization).toBe(
      "Bearer test-token",
    );
  });
  it("treats authentication rejection as a known failure before creating a remote order", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 401 }));
    vi.stubGlobal("fetch", fetcher);
    const api = await import("../../api/_lib/payflex-client");
    await expect(
      api.createPayflexOrder({ amount: 100 }),
    ).rejects.toBeInstanceOf(api.PayflexRejected);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("keeps an uncertain order-creation failure distinct from a known rejection", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ access_token: "test-token", expires_in: 3600 }),
            { status: 200 },
          ),
        )
        .mockRejectedValueOnce(new Error("Network interrupted")),
    );
    const api = await import("../../api/_lib/payflex-client");
    await expect(api.createPayflexOrder({ amount: 100 })).rejects.toThrow(
      "Network interrupted",
    );
  });
});

describe("Payflex launch configuration", () => {
  it("does not allow sandbox payments on a production Vercel deployment", async () => {
    vi.stubEnv("PAYFLEX_CLIENT_ID", "test-client");
    vi.stubEnv("PAYFLEX_CLIENT_SECRET", "test-secret");
    vi.stubEnv("SESSION_SECRET", "test-secret-with-more-than-32-characters");
    vi.stubEnv("SITE_URL", "https://hawk.example");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("PAYFLEX_ENVIRONMENT", "sandbox");
    const api = await import("../../api/_lib/payflex-client");
    expect(api.payflexReady()).toBe(false);
    vi.stubEnv("PAYFLEX_ENVIRONMENT", "live");
    expect(api.payflexReady()).toBe(true);
  });
  it("requires a valid HTTPS origin before any stock hold is offered", async () => {
    vi.stubEnv("PAYFLEX_CLIENT_ID", "test-client");
    vi.stubEnv("PAYFLEX_CLIENT_SECRET", "test-secret");
    vi.stubEnv("SESSION_SECRET", "test-secret-with-more-than-32-characters");
    vi.stubEnv("SITE_URL", "https://hawk.example/not-an-origin");
    const api = await import("../../api/_lib/payflex-client");
    expect(api.payflexReady()).toBe(false);
  });
});
