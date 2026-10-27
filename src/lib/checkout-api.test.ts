import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PRODUCT_ID,
  ORDER_ID,
  REMOTE_ID,
  speaker,
  store,
} from "../test-fixtures/commerce";
import type { ApiRequest, ApiResponse } from "../../api/_lib/http";
const memory = vi.hoisted(() => ({
  rows: [] as { id: string; kind: string; data: Record<string, unknown> }[],
}));
vi.mock("../../db/index", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({ where: async () => structuredClone(memory.rows) }),
    }),
    insert: () => ({
      values: (row: {
        id: string;
        kind: string;
        data: Record<string, unknown>;
      }) => ({
        onConflictDoNothing: () => ({
          returning: async () => {
            if (memory.rows.some((r) => r.id === row.id)) return [];
            memory.rows.push(structuredClone(row));
            return [structuredClone(row)];
          },
        }),
      }),
    }),
    update: () => ({
      set: (value: { data: Record<string, unknown> }) => ({
        where: () => {
          const run = async () => {
            const row = memory.rows[0];
            if (!row) return [];
            if ("queryChunks" in value.data)
              row.data = {
                ...row.data,
                payflexOrderId: "2f549b62-5e66-4f2e-8c7c-f5497fa17142",
                payflexUrl:
                  "https://checkout.payflex.co.za/checkout?token=test",
                paymentState: "pending",
              };
            else row.data = value.data;
            return [structuredClone(row)];
          };
          return {
            returning: run,
            then: (
              resolve: (value: unknown) => void,
              reject: (e: unknown) => void,
            ) => run().then(resolve, reject),
          };
        },
      }),
    }),
  }),
}));
vi.mock("../../db/products", () => ({ listProducts: vi.fn() }));
vi.mock("../../db/settings", () => ({ getSettings: vi.fn() }));
vi.mock("../../api/_lib/rate-limit", () => ({
  allowAuth: vi.fn().mockResolvedValue(true),
}));
vi.mock("../../api/_lib/payflex-client", () => ({
  payflexReady: () => true,
  siteUrl: () => "https://hawk.example",
  createPayflexOrder: vi.fn(),
  PayflexRejected: class PayflexRejected extends Error {},
}));
vi.mock("../../api/_lib/stock-orders", () => ({
  reserveOrder: vi.fn(),
  adjustOrderStock: vi.fn(),
}));
vi.mock("../../api/_lib/order-notification", () => ({
  notifyOrder: vi.fn().mockResolvedValue(true),
}));
import checkout from "../../api/checkout";
import { quoteFor } from "../../api/_lib/checkout-common";
import { listProducts } from "../../db/products";
import { getSettings } from "../../db/settings";
import {
  createPayflexOrder,
  PayflexRejected,
} from "../../api/_lib/payflex-client";
import { reserveOrder, adjustOrderStock } from "../../api/_lib/stock-orders";
beforeEach(() => {
  memory.rows = [];
  vi.stubEnv(
    "SESSION_SECRET",
    "test-signing-secret-with-at-least-32-characters",
  );
  vi.mocked(listProducts).mockResolvedValue([speaker()] as never);
  vi.mocked(getSettings).mockResolvedValue(store());
  vi.mocked(reserveOrder).mockImplementation(async (id, data) => {
    const row = { id, kind: "orders", data };
    memory.rows.push(structuredClone(row));
    return { ...row, createdAt: "2026-10-27" };
  });
  vi.mocked(createPayflexOrder).mockResolvedValue({
    orderId: REMOTE_ID,
    redirectUrl: "https://checkout.payflex.co.za/checkout?token=test",
  });
  vi.mocked(adjustOrderStock).mockImplementation(async (id, _old, data) => ({
    id,
    kind: "orders",
    data: { ...data, stockReserved: false },
    createdAt: "2026-10-27",
  }));
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});
async function payload(intent: "pay" | "quote" = "pay") {
  const selection = {
    lines: [{ productId: PRODUCT_ID, quantity: 1 }],
    destination: {
      country: intent === "pay" ? "ZA" : "BW",
      postcode: intent === "pay" ? "2000" : "",
      method: "delivery" as const,
    },
  };
  const { quote } = await quoteFor(selection);
  return {
    ...selection,
    key: ORDER_ID,
    quoteId: quote.quoteId,
    intent,
    customer: {
      name: "Guest Buyer",
      email: "guest@hawk.example",
      phone: "+27 11 555 1234",
      addressLine1: "42 Test Road",
      addressLine2: "",
      suburb: "",
      city: "Test City",
      province: "",
      billingSame: true,
      billingAddressLine1: "",
      billingCity: "",
      billingProvince: "",
      billingPostcode: "",
      billingCountry: "ZA",
    },
    notes: "",
    consent: true,
  };
}
async function call(body: unknown) {
  let result = "";
  const res = {
    statusCode: 200,
    writableEnded: false,
    setHeader() {},
    end(value: string) {
      result = value;
    },
  } as unknown as ApiResponse;
  await checkout(
    {
      method: "POST",
      url: "/api/checkout",
      headers: { host: "hawk.example", origin: "https://hawk.example" },
      socket: { remoteAddress: "test" },
      body,
    } as unknown as ApiRequest,
    res,
  );
  return { status: res.statusCode, payload: JSON.parse(result) };
}
describe("guest checkout API", () => {
  it("recalculates totals and accepts the delivery quote without requiring login", async () => {
    const input = await payload();
    const result = await call({ ...input, total: 1, payment: "paid" });
    expect(result.status).toBe(201);
    expect(reserveOrder).toHaveBeenCalledTimes(1);
    expect(createPayflexOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 2660,
        shippingAmount: 160,
        merchantReference: ORDER_ID,
      }),
    );
    expect(memory.rows[0].data.payment).toBe("unpaid");
    expect(result.payload.redirectUrl).toContain("payflex.co.za");
  });
  it("does not create a second order or payment session when a request is retried", async () => {
    const input = await payload();
    await call(input);
    const repeated = await call(input);
    expect(repeated.status).toBe(200);
    expect(repeated.payload.reused).toBe(true);
    expect(reserveOrder).toHaveBeenCalledTimes(1);
    expect(createPayflexOrder).toHaveBeenCalledTimes(1);
  });
  it("never starts Payflex when the atomic stock reservation fails", async () => {
    vi.mocked(reserveOrder).mockResolvedValue(undefined);
    const result = await call(await payload());
    expect(result.status).toBe(409);
    expect(createPayflexOrder).not.toHaveBeenCalled();
  });
  it("records SADC quote requests without reserving stock or charging", async () => {
    const result = await call(await payload("quote"));
    expect(result.status).toBe(201);
    expect(memory.rows[0].data.quoteRequired).toBe(true);
    expect(memory.rows[0].data.stockReserved).toBe(false);
    expect(createPayflexOrder).not.toHaveBeenCalled();
    expect(reserveOrder).not.toHaveBeenCalled();
  });
  it("releases a known rejected payment setup", async () => {
    vi.mocked(createPayflexOrder).mockRejectedValue(
      new PayflexRejected("Rejected"),
    );
    const result = await call(await payload());
    expect(result.status).toBe(502);
    expect(adjustOrderStock).toHaveBeenCalledWith(
      ORDER_ID,
      expect.anything(),
      expect.objectContaining({ paymentState: "setup-failed" }),
      "release",
    );
  });
  it("retains the reservation and order reference when payment creation is uncertain", async () => {
    vi.mocked(createPayflexOrder).mockRejectedValue(
      new Error("Network timeout"),
    );
    const input = await payload();
    const result = await call(input);
    expect(result.status).toBe(502);
    expect(memory.rows[0].data.paymentState).toBe("needs-review");
    expect(memory.rows[0].data.stockReserved).toBe(true);
    expect(adjustOrderStock).not.toHaveBeenCalled();
    await call(input);
    expect(createPayflexOrder).toHaveBeenCalledTimes(1);
  });
  it("rejects a stale displayed delivery total before reserving or charging", async () => {
    const input = await payload();
    input.quoteId = "stale-quote";
    const result = await call(input);
    expect(result.status).toBe(409);
    expect(reserveOrder).not.toHaveBeenCalled();
    expect(createPayflexOrder).not.toHaveBeenCalled();
  });
});

it("does not let a cross-border customer force the Payflex payment path", async () => {
  const input = await payload("quote");
  input.intent = "pay";
  const result = await call(input);
  expect(result.status).toBe(409);
  expect(createPayflexOrder).not.toHaveBeenCalled();
});
it("starts only one payment session when duplicate checkout requests arrive concurrently", async () => {
  let release: () => void = () => {};
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });
  vi.mocked(reserveOrder).mockImplementation(async (id, data) => {
    if (memory.rows.some((r) => r.id === id)) {
      release();
      return undefined;
    }
    const row = { id, kind: "orders", data };
    memory.rows.push(structuredClone(row));
    await waiting;
    return { ...row, createdAt: "2026-10-27" };
  });
  const input = await payload();
  const results = await Promise.all([call(input), call(input)]);
  expect(results.every((r) => r.status === 200 || r.status === 201)).toBe(true);
  expect(createPayflexOrder).toHaveBeenCalledTimes(1);
  expect(memory.rows).toHaveLength(1);
});

it("returns the receipt instead of reopening Payflex after a payment was already verified", async () => {
  const input = await payload();
  await call(input);
  memory.rows[0].data.payment = "paid";
  memory.rows[0].data.paymentState = "approved";
  const again = await call(input);
  expect(again.status).toBe(200);
  expect(again.payload.redirectUrl).toBeNull();
  expect(createPayflexOrder).toHaveBeenCalledTimes(1);
});
