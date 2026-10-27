import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
const state = vi.hoisted(() => ({ claim: true, writes: [] as unknown[] }));
vi.mock("../../db/index", () => ({
  getDb: () => ({
    update: () => ({
      set: (value: unknown) => ({
        where: () => {
          state.writes.push(value);
          return {
            returning: async () =>
              state.claim
                ? [
                    {
                      id: "313b85e0-3642-45f8-8385-bf60d442219a",
                      data: {
                        email: "buyer@hawk.example",
                        name: "Buyer",
                        status: "shipped",
                        fulfillmentRevision: 2,
                        courier: "Courier",
                        tracking: "SHIP42",
                        trackingUrl: "https://courier.example/SHIP42",
                        items: [
                          {
                            productId: "313b85e0-3642-45f8-8385-bf60d442219a",
                            name: "Speaker",
                            quantity: 1,
                          },
                        ],
                      },
                    },
                  ]
                : [],
            then: (resolve: (value: unknown) => void) =>
              Promise.resolve([]).then(resolve),
          };
        },
      }),
    }),
  }),
}));
vi.mock("../../api/_lib/email", () => ({ sendEmail: vi.fn() }));
vi.mock("../../api/_lib/payflex-client", () => ({
  siteUrl: () => "https://hawk.example",
  payflexReady: () => true,
}));
import { sendEmail } from "../../api/_lib/email";
import { notifyFulfillment } from "../../api/_lib/fulfillment-notification";
beforeEach(() => {
  state.claim = true;
  state.writes = [];
  vi.stubEnv(
    "SESSION_SECRET",
    "test-signing-secret-with-at-least-32-characters",
  );
  vi.mocked(sendEmail).mockResolvedValue(undefined);
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});
describe("fulfillment emails", () => {
  it("sends a signed tracking link and uses a stable revision idempotency key", async () => {
    expect(
      await notifyFulfillment("313b85e0-3642-45f8-8385-bf60d442219a"),
    ).toBe(true);
    expect(sendEmail).toHaveBeenCalledWith(
      "buyer@hawk.example",
      "Your order is on its way",
      expect.stringContaining(
        "https://hawk.example/orders/313b85e0-3642-45f8-8385-bf60d442219a/",
      ),
      "313b85e0-3642-45f8-8385-bf60d442219a-fulfillment-2",
      expect.objectContaining({
        eyebrow: "Order update",
        action: expect.objectContaining({ label: "Track your order" }),
      }),
    );
    expect(state.writes).toHaveLength(2);
  });
  it("persists a failed delivery result instead of losing the saved order update", async () => {
    vi.mocked(sendEmail).mockRejectedValue(new Error("Email unavailable"));
    expect(
      await notifyFulfillment("313b85e0-3642-45f8-8385-bf60d442219a"),
    ).toBe(false);
    expect(state.writes).toHaveLength(2);
  });
  it("does not resend when no pending notification can be claimed", async () => {
    state.claim = false;
    expect(
      await notifyFulfillment("313b85e0-3642-45f8-8385-bf60d442219a"),
    ).toBe(true);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
