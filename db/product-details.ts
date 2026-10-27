import { z } from "zod";
const measure = z.number().positive().max(10000).nullable().default(null);
export const productDetailsSchema = z
  .object({
    imageDisplayScale: z.number().int().min(25).max(100).default(100),
    sku: z.string().trim().max(80).default(""),
    soldAs: z
      .enum(["unspecified", "single", "pair", "set"])
      .default("unspecified"),
    speakerType: z
      .enum(["unspecified", "active", "passive", "not-applicable"])
      .default("unspecified"),
    continuousWatts: measure,
    impedanceOhms: measure,
    frequencyResponse: z.string().trim().max(160).default(""),
    connections: z.string().trim().max(500).default(""),
    dimensions: z.string().trim().max(200).default(""),
    weightKg: measure,
    packedWeightKg: measure,
    packedLengthCm: measure,
    packedWidthCm: measure,
    packedHeightCm: measure,
    included: z.string().trim().max(2000).default(""),
    warranty: z.string().trim().max(2000).default(""),
    dispatchMinDays: z.number().int().min(0).max(365).nullable().default(null),
    dispatchMaxDays: z.number().int().min(0).max(365).nullable().default(null),
    freightOnly: z.boolean().default(false),
  })
  .refine(
    (v) =>
      v.dispatchMaxDays === null ||
      v.dispatchMinDays === null ||
      v.dispatchMaxDays >= v.dispatchMinDays,
    {
      path: ["dispatchMaxDays"],
      message: "Maximum dispatch time must be at least the minimum",
    },
  );
export type ProductDetails = z.infer<typeof productDetailsSchema>;
export const DEFAULT_PRODUCT_DETAILS = productDetailsSchema.parse({});
export function normaliseProductDetails(value: unknown): ProductDetails {
  const parsed = productDetailsSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_PRODUCT_DETAILS;
}
export const SOLD_AS_LABEL = {
  unspecified: "Pack contents to be confirmed",
  single: "Sold individually — 1 unit",
  pair: "Sold as a pair — 2 units",
  set: "Sold as a complete set",
};
