import { z } from "zod";
export const SADC_COUNTRIES = [
  { code: "ZA", name: "South Africa" },
  { code: "AO", name: "Angola" },
  { code: "BW", name: "Botswana" },
  { code: "KM", name: "Comoros" },
  { code: "CD", name: "DR Congo" },
  { code: "SZ", name: "Eswatini" },
  { code: "LS", name: "Lesotho" },
  { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" },
  { code: "MU", name: "Mauritius" },
  { code: "MZ", name: "Mozambique" },
  { code: "NA", name: "Namibia" },
  { code: "SC", name: "Seychelles" },
  { code: "TZ", name: "Tanzania" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
] as const;
export const countrySchema = z.enum(
  SADC_COUNTRIES.map((c) => c.code) as ["ZA", ...string[]],
);
const optionalNumber = z.number().min(0).max(1000000).nullable();
export const zoneSchema = z
  .object({
    id: z.uuid(),
    name: z.string().trim().min(2).max(100),
    enabled: z.boolean(),
    countries: z.array(countrySchema).min(1),
    postcodePrefixes: z
      .array(
        z
          .string()
          .trim()
          .min(1)
          .max(12)
          .transform((value) => value.toUpperCase().replace(/\s/g, "")),
      )
      .max(100),
    baseZar: optionalNumber,
    perKgZar: optionalNumber,
    maxWeightKg: z.number().positive().max(100000).nullable(),
    volumetricDivisor: z.number().positive().max(100000).nullable(),
    transitMinDays: z.number().int().min(1).max(365).nullable(),
    transitMaxDays: z.number().int().min(1).max(365).nullable(),
  })
  .superRefine((v, ctx) => {
    if (!v.enabled) return;
    for (const key of [
      "baseZar",
      "perKgZar",
      "transitMinDays",
      "transitMaxDays",
    ] as const)
      if (v[key] === null)
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "Enter a value before enabling this zone",
        });
    if (
      v.transitMinDays !== null &&
      v.transitMaxDays !== null &&
      v.transitMaxDays < v.transitMinDays
    )
      ctx.addIssue({
        code: "custom",
        path: ["transitMaxDays"],
        message: "Maximum transit days must be at least the minimum",
      });
  });
export const salesSettingsSchema = z
  .object({
    checkoutEnabled: z.boolean().default(false),
    dispatchCountry: countrySchema.default("ZA"),
    collectionEnabled: z.boolean().default(false),
    collectionLeadDays: z.number().int().min(0).max(365).default(0),
    vatIncludedPercent: z.number().min(0).max(100).default(0),
    deliveryNotes: z.string().trim().max(2000).default(""),
    returnsPolicy: z.string().trim().max(4000).default(""),
    zones: z.array(zoneSchema).max(60).default([]),
  })
  .superRefine((v, ctx) => {
    if (v.checkoutEnabled) {
      if (v.deliveryNotes.length < 20)
        ctx.addIssue({
          code: "custom",
          path: ["deliveryNotes"],
          message: "Add your delivery conditions before enabling payment",
        });
      if (v.returnsPolicy.length < 20)
        ctx.addIssue({
          code: "custom",
          path: ["returnsPolicy"],
          message: "Add your actual returns policy before enabling payment",
        });
    }
    const active = v.zones.filter((z) => z.enabled);
    for (let i = 0; i < active.length; i++)
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i],
          b = active[j];
        if (!a.countries.some((c) => b.countries.includes(c))) continue;
        const ap = a.postcodePrefixes.length ? a.postcodePrefixes : [""],
          bp = b.postcodePrefixes.length ? b.postcodePrefixes : [""];
        if (ap.some((p) => bp.includes(p)))
          ctx.addIssue({
            code: "custom",
            path: ["zones"],
            message:
              "Enabled delivery zones cannot have overlapping countries and identical postcode prefixes",
          });
      }
  });
export type SalesSettings = z.infer<typeof salesSettingsSchema>;
export const DEFAULT_SALES_SETTINGS = salesSettingsSchema.parse({});
export const cartLinesSchema = z
  .array(
    z.object({
      productId: z.uuid(),
      quantity: z.number().int().min(1).max(99),
    }),
  )
  .min(1)
  .max(40)
  .superRefine((lines, ctx) => {
    if (new Set(lines.map((l) => l.productId)).size !== lines.length)
      ctx.addIssue({
        code: "custom",
        message: "Combine duplicate products into one cart line",
      });
  });
export const destinationSchema = z
  .object({
    country: countrySchema,
    postcode: z.string().trim().max(16).default(""),
    method: z.enum(["delivery", "collection"]),
  })
  .superRefine((v, ctx) => {
    if (
      v.method === "delivery" &&
      v.country === "ZA" &&
      !/^\d{4}$/.test(v.postcode)
    )
      ctx.addIssue({
        code: "custom",
        path: ["postcode"],
        message: "Enter a four-digit South African postcode",
      });
  });
export const estimateInputSchema = z.object({
  lines: cartLinesSchema,
  destination: destinationSchema,
});
export const checkoutInputSchema = estimateInputSchema.extend({
  key: z.uuid(),
  quoteId: z.string().min(1).max(128),
  intent: z.enum(["pay", "quote"]),
  customer: z.object({
    name: z.string().trim().min(2).max(160),
    email: z
      .string()
      .trim()
      .email()
      .transform((e) => e.toLowerCase()),
    phone: z.string().trim().min(7).max(40),
    addressLine1: z.string().trim().min(3).max(200),
    addressLine2: z.string().trim().max(200).default(""),
    suburb: z.string().trim().max(100).default(""),
    city: z.string().trim().min(2).max(100),
    province: z.string().trim().max(100).default(""),
    billingSame: z.boolean(),
    billingAddressLine1: z.string().trim().max(200).default(""),
    billingCity: z.string().trim().max(100).default(""),
    billingProvince: z.string().trim().max(100).default(""),
    billingPostcode: z.string().trim().max(16).default(""),
    billingCountry: countrySchema.default("ZA"),
  }),
  consent: z.literal(true),
  marketingConsent: z.boolean().default(false),
  notes: z.string().trim().max(1500).default(""),
});
export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
export type EstimateInput = z.infer<typeof estimateInputSchema>;
