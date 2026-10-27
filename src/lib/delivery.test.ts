import { describe, expect, it } from "vitest";
import { calculateDelivery, toCents } from "../../db/checkout-model";
import {
  checkoutInputSchema,
  estimateInputSchema,
  salesSettingsSchema,
} from "../../db/sales-validation";
import { speaker, store, PRODUCT_ID } from "../test-fixtures/commerce";
const input = () => ({
  lines: [{ productId: PRODUCT_ID, quantity: 2 }],
  destination: { country: "ZA", postcode: "2000", method: "delivery" as const },
});
describe("delivery estimates", () => {
  it("uses server prices and adds configured delivery without losing cents", () => {
    const settings = store();
    settings.sales.zones[0].baseZar = 100.25;
    const q = calculateDelivery(
      input(),
      [speaker()],
      settings.sales,
      new Date("2026-10-23T10:00:00Z"),
    );
    expect(q.subtotalCents).toBe(500000);
    expect(q.shippingCents).toBe(22025);
    expect(q.totalCents).toBe(522025);
    expect(q.payable).toBe(true);
    expect(q.arrivalMin).toBe("2026-10-28");
    expect(q.arrivalMax).toBe("2026-11-02");
  });
  it("chooses the longest matching postcode prefix", () => {
    const settings = store();
    settings.sales.zones.push({
      ...settings.sales.zones[0],
      id: "672a47d7-e5e6-4a0d-b829-8350df95a662",
      name: "Specific zone",
      postcodePrefixes: ["20"],
      baseZar: 10,
    });
    expect(
      calculateDelivery(input(), [speaker()], settings.sales).shippingCents,
    ).toBe(13000);
  });
  it("uses volumetric weight only when the courier divisor is configured", () => {
    const settings = store();
    settings.sales.zones[0].volumetricDivisor = 5000;
    expect(
      calculateDelivery(input(), [speaker()], settings.sales).weightKg,
    ).toBe(48);
  });
  it("requests a quote for oversized and unknown packed shipments", () => {
    const settings = store();
    const p = speaker();
    p.details.packedWeightKg = 40;
    expect(calculateDelivery(input(), [p], settings.sales).payable).toBe(false);
    p.details.packedWeightKg = null;
    expect(
      calculateDelivery(input(), [p], settings.sales).shippingCents,
    ).toBeNull();
  });
  it("supports SADC estimates while keeping cross-border orders out of Payflex", () => {
    const settings = store();
    settings.sales.zones[0].countries = ["BW"];
    const q = calculateDelivery(
      {
        ...input(),
        destination: { country: "BW", postcode: "", method: "delivery" },
      },
      [speaker()],
      settings.sales,
    );
    expect(q.shippingCents).toBe(22000);
    expect(q.crossBorder).toBe(true);
    expect(q.payable).toBe(false);
  });
  it("does not invent shipping charges for uncovered countries", () => {
    const q = calculateDelivery(
      {
        ...input(),
        destination: { country: "NA", postcode: "9000", method: "delivery" },
      },
      [speaker()],
      store().sales,
    );
    expect(q.shippingCents).toBeNull();
    expect(q.totalCents).toBeNull();
  });
  it("does not promise stock already held by another order", () => {
    const p = speaker();
    p.stockAvailable = 1;
    expect(calculateDelivery(input(), [p], store().sales).payable).toBe(false);
  });
  it("does not allow purchasing an unspecified pack", () => {
    const p = speaker();
    p.details.soldAs = "unspecified";
    expect(calculateDelivery(input(), [p], store().sales).payable).toBe(false);
  });
  it("does not quote unpublished products", () => {
    const p = speaker();
    p.published = false;
    expect(() => calculateDelivery(input(), [p], store().sales)).toThrow(
      "no longer available",
    );
  });
  it("handles free collection only when enabled", () => {
    const settings = store();
    settings.sales.collectionEnabled = true;
    const q = calculateDelivery(
      {
        ...input(),
        destination: { country: "ZA", postcode: "2000", method: "collection" },
      },
      [speaker()],
      settings.sales,
    );
    expect(q.shippingCents).toBe(0);
    expect(q.payable).toBe(true);
    settings.sales.collectionEnabled = false;
    expect(
      calculateDelivery(
        {
          ...input(),
          destination: {
            country: "ZA",
            postcode: "2000",
            method: "collection",
          },
        },
        [speaker()],
        settings.sales,
      ).payable,
    ).toBe(false);
  });
  it("calculates included tax without adding it twice", () => {
    const settings = store();
    settings.sales.vatIncludedPercent = 15;
    const q = calculateDelivery(input(), [speaker()], settings.sales);
    expect(q.totalCents).toBe(522000);
    expect(q.taxIncludedCents).toBe(Math.round(522000 - 522000 / 1.15));
    expect(toCents(19.99)).toBe(1999);
  });
});
describe("checkout input validation", () => {
  it("rejects repeated product IDs and invalid quantities", () => {
    expect(
      estimateInputSchema.safeParse({
        ...input(),
        lines: [...input().lines, ...input().lines],
      }).success,
    ).toBe(false);
    expect(
      estimateInputSchema.safeParse({
        ...input(),
        lines: [{ productId: PRODUCT_ID, quantity: -1 }],
      }).success,
    ).toBe(false);
  });
  it("validates South African postcodes and SADC destinations", () => {
    expect(
      estimateInputSchema.safeParse({
        ...input(),
        destination: { country: "ZA", postcode: "12", method: "delivery" },
      }).success,
    ).toBe(false);
    expect(
      estimateInputSchema.safeParse({
        ...input(),
        destination: { country: "US", postcode: "90210", method: "delivery" },
      }).success,
    ).toBe(false);
  });
  it("does not publish overlapping delivery rules or incomplete fees", () => {
    const sales = store().sales;
    sales.zones.push({
      ...sales.zones[0],
      id: "672a47d7-e5e6-4a0d-b829-8350df95a663",
    });
    expect(salesSettingsSchema.safeParse(sales).success).toBe(false);
    sales.zones.pop();
    sales.zones[0].baseZar = null;
    expect(salesSettingsSchema.safeParse(sales).success).toBe(false);
  });
  it("requires guest contact details and explicit review confirmation", () => {
    expect(
      checkoutInputSchema.safeParse({
        ...input(),
        key: PRODUCT_ID,
        quoteId: "test",
        intent: "pay",
        customer: {},
        consent: false,
      }).success,
    ).toBe(false);
  });
});

it("does not show an arrival date for out-of-stock or unpriced equipment", () => {
  const p = speaker();
  p.stockAvailable = 0;
  expect(calculateDelivery(input(), [p], store().sales).arrivalMin).toBeNull();
  p.stockAvailable = 5;
  p.priceZar = 0;
  const q = calculateDelivery(input(), [p], store().sales);
  expect(q.priceOnRequest).toBe(true);
  expect(q.totalCents).toBeNull();
});
it("permits specialist-freight products to be collected when the store offers collection", () => {
  const p = speaker();
  p.details.freightOnly = true;
  const settings = store();
  settings.sales.collectionEnabled = true;
  expect(
    calculateDelivery(
      {
        ...input(),
        destination: { country: "ZA", postcode: "2000", method: "collection" },
      },
      [p],
      settings.sales,
    ).payable,
  ).toBe(true);
});
it("does not promise same-day collection on a weekend when estimates exclude weekends", () => {
  const p = speaker();
  p.details.dispatchMinDays = 0;
  p.details.dispatchMaxDays = 0;
  const settings = store();
  settings.sales.collectionEnabled = true;
  expect(
    calculateDelivery(
      {
        ...input(),
        destination: { country: "ZA", postcode: "2000", method: "collection" },
      },
      [p],
      settings.sales,
      new Date("2026-10-25T12:00:00Z"),
    ).arrivalMin,
  ).toBe("2026-10-26");
});
