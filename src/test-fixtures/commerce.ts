import { DEFAULT_PRODUCT_DETAILS } from "../../db/product-details";
import { DEFAULT_SALES_SETTINGS } from "../../db/sales-validation";
import type { SettingsInput, ProductRecord } from "../../db/validation";
import { DEFAULT_SETTINGS } from "../../db/validation";
export const PRODUCT_ID = "313b85e0-3642-45f8-8385-bf60d442219a";
export const ORDER_ID = "8444958a-6139-4abe-a805-39463506fc30";
export const REMOTE_ID = "2f549b62-5e66-4f2e-8c7c-f5497fa17142";
export function speaker(): ProductRecord {
  return {
    id: PRODUCT_ID,
    name: "Test passive speaker",
    slug: "test-passive-speaker",
    category: "speakers",
    priceZar: 2500,
    description: "A test fixture containing verified speaker information.",
    shortDescription: "A test speaker fixture.",
    availability: "in-stock",
    published: true,
    images: [],
    specs: [],
    details: {
      ...DEFAULT_PRODUCT_DETAILS,
      sku: "TEST-15",
      soldAs: "single",
      speakerType: "passive",
      continuousWatts: 500,
      impedanceOhms: 8,
      included: "One speaker and a manual",
      dispatchMinDays: 1,
      dispatchMaxDays: 2,
      packedWeightKg: 12,
      packedLengthCm: 50,
      packedWidthCm: 40,
      packedHeightCm: 60,
    },
    stockAvailable: 5,
    createdAt: "2026-10-01T12:00:00.000Z",
    updatedAt: "2026-10-01T12:00:00.000Z",
  };
}
export function store(): SettingsInput {
  return {
    ...structuredClone(DEFAULT_SETTINGS),
    onboardingCompleted: true,
    contact: {
      email: "support@hawk.example",
      phone: "+27 11 555 1234",
      address: "42 Test Road, Johannesburg",
      hours: "Monday–Friday 08:00–17:00",
    },
    sales: {
      ...structuredClone(DEFAULT_SALES_SETTINGS),
      checkoutEnabled: true,
      deliveryNotes:
        "These are test delivery conditions, not published shipping rates.",
      returnsPolicy:
        "These are test return instructions provided only as a fixture.",
      zones: [
        {
          id: "672a47d7-e5e6-4a0d-b829-8350df95a661",
          name: "Test South Africa zone",
          enabled: true,
          countries: ["ZA"],
          postcodePrefixes: [],
          baseZar: 100,
          perKgZar: 5,
          maxWeightKg: 50,
          volumetricDivisor: null,
          transitMinDays: 2,
          transitMaxDays: 4,
        },
      ],
    },
  };
}
