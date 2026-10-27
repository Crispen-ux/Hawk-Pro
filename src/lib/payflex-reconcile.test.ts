import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ORDER_ID, REMOTE_ID, PRODUCT_ID } from "../test-fixtures/commerce";
const state = vi.hoisted(() => ({
  order: null as null | {
    id: string;
    kind: string;
    data: Record<string, unknown>;
  },
  updates: 0,
}));
vi.mock("../../db/index", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: async () => (state.order ? [structuredClone(state.order)] : []),
      }),
    }),
    update: () => ({
      set: (value: { data: Record<string, unknown> }) => ({
        where: () => ({
          returning: async () => {
            state.updates++;
            state.order = { ...state.order!, data: value.data };
            return [structuredClone(state.order)];
          },
        }),
      }),
    }),
  }),
}));
vi.mock("../../api/_lib/payflex-client", () => ({
  getPayflexOrder: vi.fn(),
  payflexReady: () => true,
}));
vi.mock("../../api/_lib/order-notification", () => ({
  notifyOrder: vi.fn().mockResolvedValue(true),
}));
vi.mock("../../api/_lib/stock-orders", () => ({ adjustOrderStock: vi.fn() }));
import { getPayflexOrder } from "../../api/_lib/payflex-client";
import {
  reconcilePayflex,
  verifyPayflexOrder,
} from "../../api/_lib/payflex-reconcile";
import callbackHandler from "../../api/payflex";
import { secureToken } from "../../api/_lib/checkout-common";
import type { ApiRequest, ApiResponse } from "../../api/_lib/http";
import { adjustOrderStock } from "../../api/_lib/stock-orders";
beforeEach(() => {
  state.updates = 0;
  state.order = {
    id: ORDER_ID,
    kind: "orders",
    data: {
      items: [{ productId: PRODUCT_ID, quantity: 1 }],
      paymentProvider: "payflex",
      payflexOrderId: REMOTE_ID,
      totalCents: 250000,
      payment: "unpaid",
      status: "pending",
      stockReserved: true,
      paymentState: "pending",
    },
  };
  vi.mocked(getPayflexOrder).mockResolvedValue({
    orderId: REMOTE_ID,
    merchantReference: ORDER_ID,
    amount: 2500,
    orderStatus: "Approved",
  });
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});
describe("verified payment reconciliation", () => {
  it("requires matching merchant reference, amount and provider ID", () => {
    const base = {
      orderId: REMOTE_ID,
      merchantReference: ORDER_ID,
      amount: 2500,
      orderStatus: "Approved" as const,
    };
    expect(() => verifyPayflexOrder(base, state.order!)).not.toThrow();
    expect(() =>
      verifyPayflexOrder({ ...base, amount: 1 }, state.order!),
    ).toThrow();
    expect(() =>
      verifyPayflexOrder(
        { ...base, merchantReference: PRODUCT_ID },
        state.order!,
      ),
    ).toThrow();
    expect(() =>
      verifyPayflexOrder({ ...base, orderId: PRODUCT_ID }, state.order!),
    ).toThrow();
  });
  it("marks an order paid only after the authenticated provider response is approved", async () => {
    const result = await reconcilePayflex(ORDER_ID);
    expect(getPayflexOrder).toHaveBeenCalledWith(REMOTE_ID);
    expect(result.order.data.payment).toBe("paid");
    expect(state.order?.data.stockReserved).toBe(true);
    expect(adjustOrderStock).not.toHaveBeenCalled();
  });
  it("does not change a paid order back to unpaid after an older event", async () => {
    state.order!.data.payment = "paid";
    vi.mocked(getPayflexOrder).mockResolvedValue({
      orderId: REMOTE_ID,
      merchantReference: ORDER_ID,
      amount: 2500,
      orderStatus: "Created",
    });
    const result = await reconcilePayflex(ORDER_ID);
    expect(result.order.data.payment).toBe("paid");
    expect(state.updates).toBe(0);
  });
  it("keeps a created but unpaid Payflex order unpaid", async () => {
    vi.mocked(getPayflexOrder).mockResolvedValue({
      orderId: REMOTE_ID,
      merchantReference: ORDER_ID,
      amount: 2500,
      orderStatus: "Created",
    });
    const result = await reconcilePayflex(ORDER_ID);
    expect(result.order.data.payment).toBe("unpaid");
    expect(result.order.data.paymentState).toBe("created");
  });
  it("releases reserved stock only for a provider-verified terminal failure", async () => {
    vi.mocked(getPayflexOrder).mockResolvedValue({
      orderId: REMOTE_ID,
      merchantReference: ORDER_ID,
      amount: 2500,
      orderStatus: "Abandoned",
    });
    vi.mocked(adjustOrderStock).mockImplementation(async (id, _old, next) => ({
      id,
      kind: "orders",
      createdAt: "2026-10-27",
      data: { ...next, stockReserved: false },
    }));
    const result = await reconcilePayflex(ORDER_ID);
    expect(adjustOrderStock).toHaveBeenCalledWith(
      ORDER_ID,
      expect.objectContaining({ stockReserved: true }),
      expect.objectContaining({ status: "cancelled" }),
      "release",
    );
    expect(result.order.data.stockReserved).toBe(false);
  });
  it("rejects approval when stock reservation has already been released", async () => {
    state.order!.data.stockReserved = false;
    await expect(reconcilePayflex(ORDER_ID)).rejects.toThrow(
      "manual stock reconciliation",
    );
    expect(state.updates).toBe(0);
  });
});

describe("Payflex callback trust boundary", () => {
  it("ignores a forged Approved status in callback JSON and queries Payflex directly", async () => {
    vi.stubEnv(
      "SESSION_SECRET",
      "test-signing-secret-that-is-at-least-32-characters",
    );
    vi.mocked(getPayflexOrder).mockResolvedValue({
      orderId: REMOTE_ID,
      merchantReference: ORDER_ID,
      amount: 2500,
      orderStatus: "Created",
    });
    let body = "";
    const res = {
      statusCode: 200,
      writableEnded: false,
      setHeader() {},
      end(value: string) {
        body = value;
      },
    } as unknown as ApiResponse;
    const req = {
      method: "POST",
      headers: {},
      query: { order: ORDER_ID, callback: secureToken(ORDER_ID, "callback") },
      body: { orderId: REMOTE_ID, orderStatus: "Approved", amount: 1 },
    } as unknown as ApiRequest;
    await callbackHandler(req, res);
    expect(res.statusCode).toBe(200);
    expect(state.order?.data.payment).toBe("unpaid");
    expect(getPayflexOrder).toHaveBeenCalledWith(REMOTE_ID);
  });
  it("rejects unsigned callbacks before querying the payment provider", async () => {
    vi.stubEnv(
      "SESSION_SECRET",
      "test-signing-secret-that-is-at-least-32-characters",
    );
    const res = {
      statusCode: 200,
      writableEnded: false,
      setHeader() {},
      end() {},
    } as unknown as ApiResponse;
    await callbackHandler(
      {
        method: "POST",
        headers: {},
        query: { order: ORDER_ID, callback: "forged" },
        body: { orderId: REMOTE_ID, orderStatus: "Approved" },
      } as unknown as ApiRequest,
      res,
    );
    expect(res.statusCode).toBe(403);
    expect(getPayflexOrder).not.toHaveBeenCalled();
    expect(state.updates).toBe(0);
  });
});
