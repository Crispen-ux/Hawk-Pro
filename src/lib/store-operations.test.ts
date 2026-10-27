import { describe, it, expect } from "vitest";
import {
  availableStock,
  safeTrackingUrl,
  updateFulfillment,
  fulfillmentEvents,
  campaignMetrics,
  campaignLink,
  csvText,
  customerProfiles,
  salesReport,
} from "../../db/store-operations";
import { recordSchemas } from "../../db/commerce-validation";
import type { CommerceRecord } from "../../db/commerce-validation";
import { PRODUCT_ID } from "../test-fixtures/commerce";
const order = (
  id: string,
  data: Record<string, unknown>,
  createdAt = "2026-10-27T10:00:00Z",
): CommerceRecord => ({
  id,
  kind: "orders",
  createdAt,
  data: {
    email: "buyer@hawk.example",
    name: "Buyer",
    total: 100,
    status: "pending",
    payment: "unpaid",
    ...data,
  },
});
describe("business operations", () => {
  it("alerts on available stock after reservations", () => {
    expect(availableStock({ quantity: 8, reserved: 7 })).toBe(1);
    expect(availableStock({ quantity: 1, reserved: 2 })).toBe(0);
  });
  it("only permits credential-free HTTPS tracking links", () => {
    expect(safeTrackingUrl("https://courier.example/track/42")).toBe(
      "https://courier.example/track/42",
    );
    for (const u of [
      "javascript:alert(1)",
      "http://courier.example",
      "https://user:secret@courier.example",
      "not a URL",
    ])
      expect(safeTrackingUrl(u)).toBe("");
  });
  it("adds status milestones once and versions changed shipment details", () => {
    const first = updateFulfillment(
      undefined,
      { status: "pending" },
      "2026-10-27T10:00:00Z",
    );
    const same = updateFulfillment(first, first, "2026-10-27T11:00:00Z");
    expect(same.fulfillmentEvents).toHaveLength(1);
    expect(same.fulfillmentRevision).toBe(1);
    const next = updateFulfillment(
      same,
      { ...same, status: "processing" },
      "2026-10-27T12:00:00Z",
    );
    expect(next.fulfillmentEvents).toHaveLength(2);
    const details = updateFulfillment(next, { ...next, courier: "Courier" });
    expect(details.fulfillmentRevision).toBe(3);
    expect(details.fulfillmentEvents).toHaveLength(2);
    expect(details.fulfillmentEmail).toBe("pending");
  });
  it("does not return malformed fulfillment events", () => {
    expect(
      fulfillmentEvents([
        { status: "hack", at: "yesterday" },
        { status: "pending", at: "2026-10-27T00:00:00Z" },
      ]),
    ).toHaveLength(1);
  });
  it("calculates campaign rates with meaningful zero denominators", () => {
    const m = campaignMetrics({
      spend: 100,
      budget: 80,
      revenue: 400,
      impressions: 1000,
      clicks: 50,
      conversions: 5,
    });
    expect(m).toMatchObject({
      roas: 4,
      ctr: 5,
      conversionRate: 10,
      cpc: 2,
      cpa: 20,
      budgetUsed: 125,
      remainingBudget: 0,
    });
    expect(campaignMetrics({}).roas).toBeNull();
  });
  it("builds encoded campaign links preserving destination queries", () => {
    const url = new URL(
      campaignLink({
        landingUrl: "https://hawk.example/shop?category=speakers",
        name: "Big Sound & More",
        channel: "Email",
      }),
    );
    expect(url.searchParams.get("category")).toBe("speakers");
    expect(url.searchParams.get("utm_campaign")).toBe("Big Sound & More");
    expect(campaignLink({ landingUrl: "javascript:alert(1)" })).toBe("");
  });
  it("escapes CSV cells and neutralizes spreadsheet formula injection", () => {
    const csv = csvText([["=SUM(1,2)", "+cmd", "@SUM(A1)"]]);
    expect(csv).toContain('"\'=SUM(1,2)"');
    expect(csv).toContain('"\'+cmd"');
    expect(csv).toContain('"\'@SUM(A1)"');
  });
  it("merges guest history case-insensitively and honors a later saved opt-out", () => {
    const records = [
      order("a", { payment: "paid", marketingConsent: true }),
      order("b", { email: "BUYER@HAWK.EXAMPLE", payment: "paid", total: 200 }),
      {
        id: "c",
        kind: "customers" as const,
        createdAt: "2026-10-27",
        data: {
          email: "buyer@hawk.example",
          name: "Updated Buyer",
          consent: false,
          notes: "Do not market",
        },
      },
    ];
    const [p] = customerProfiles(records);
    expect(p).toMatchObject({
      name: "Updated Buyer",
      spent: 300,
      paidOrders: 2,
      consent: false,
      segment: "Returning",
    });
    expect(p.orders).toHaveLength(2);
  });
  it("never treats checkout confirmation or unpaid quotes as marketing consent or revenue", () => {
    const [p] = customerProfiles([
      order("a", { consent: true, quoteRequired: true, total: 200 }),
    ]);
    expect(p.consent).toBe(false);
    expect(p.spent).toBe(0);
    expect(p.segment).toBe("Enquiry / unpaid");
  });
  it("uses payment dates and local midnight for receipt reporting", () => {
    const r = salesReport(
      [
        order(
          "a",
          {
            payment: "paid",
            paidAt: "2026-10-26T22:30:00Z",
            total: 120,
            shippingCents: 2000,
            taxIncludedCents: 1500,
          },
          "2026-09-01T10:00:00Z",
        ),
        order("b", { payment: "unpaid", total: 999 }),
      ],
      "2026-10-27",
      "2026-10-27",
    );
    expect(r.revenue).toBe(120);
    expect(r.shipping).toBe(20);
    expect(r.goodsRevenue).toBe(100);
    expect(r.tax).toBe(15);
    expect(r.created).toHaveLength(1);
  });
  it("records a full refund on its own date while preserving original gross receipts", () => {
    const row = order("a", {
      payment: "refunded",
      paidAt: "2026-10-20T10:00:00Z",
      refundedAt: "2026-10-27T10:00:00Z",
      total: 100,
    });
    expect(salesReport([row], "2026-10-20", "2026-10-20")).toMatchObject({
      revenue: 100,
      refunds: 0,
      netReceipts: 100,
    });
    expect(salesReport([row], "2026-10-27", "2026-10-27")).toMatchObject({
      revenue: 0,
      refunds: 100,
      netReceipts: -100,
    });
    expect(salesReport([row], "2026-10-01", "2026-10-31")).toMatchObject({
      revenue: 100,
      refunds: 100,
      netReceipts: 0,
    });
  });
  it("rejects malformed shipment dates and unsafe links without throwing", () => {
    const base = {
      name: "Buyer",
      email: "buyer@hawk.example",
      productId: PRODUCT_ID,
      quantity: 1,
      status: "pending",
      payment: "unpaid",
      address: "42 Test Road",
    };
    for (const estimatedDelivery of ["2026-99-99", "2026-02-30"])
      expect(
        recordSchemas.orders.safeParse({ ...base, estimatedDelivery }).success,
      ).toBe(false);
    expect(
      recordSchemas.orders.safeParse({
        ...base,
        trackingUrl: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });
  it("rejects backwards campaign date ranges", () => {
    expect(
      recordSchemas.campaigns.safeParse({
        name: "Campaign",
        channel: "Email",
        status: "Draft",
        budget: 0,
        spend: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        notes: "",
        startsOn: "2026-10-28",
        endsOn: "2026-10-27",
      }).success,
    ).toBe(false);
  });
});
