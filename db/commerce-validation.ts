import { z } from "zod";
const dateField = z
  .string()
  .refine(
    (v) =>
      !v ||
      (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
        Number.isFinite(Date.parse(v)) &&
        new Date(v).toISOString().slice(0, 10) === v),
    "Enter a valid date",
  )
  .default("");
const httpsField = z
  .string()
  .max(1000)
  .refine((v) => {
    if (!v) return true;
    try {
      const u = new URL(v);
      return u.protocol === "https:" && !u.username && !u.password;
    } catch {
      return false;
    }
  }, "Enter a complete HTTPS URL")
  .default("");
export const orderStatuses = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export const recordSchemas = {
  orders: z.object({
    name: z.string().min(2).max(160),
    email: z.email().transform((email) => email.toLowerCase()),
    productId: z.uuid(),
    quantity: z.number().int().min(1).max(4000),
    status: z.enum(orderStatuses),
    payment: z.enum(["unpaid", "paid", "refunded"]),
    tracking: z.string().max(200).default(""),
    courier: z.string().trim().max(100).default(""),
    trackingUrl: httpsField,
    estimatedDelivery: dateField,
    address: z.string().min(5).max(1000),
    total: z.number().min(0).optional(),
    goodsQuoteZar: z.number().min(0).max(100000000).optional(),
    deliveryQuoteZar: z.number().min(0).max(10000000).optional(),
  }),
  customers: z.object({
    name: z.string().min(2).max(160),
    email: z.email().transform((email) => email.toLowerCase()),
    phone: z.string().max(60),
    notes: z.string().max(2000),
    consent: z.boolean().default(false),
  }),
  inventory: z.object({
    productId: z.uuid(),
    quantity: z.number().int().min(0).max(100000),
    threshold: z.number().int().min(0).max(100000),
    adjustmentReason: z.string().trim().max(300).default(""),
    unitCostZar: z.number().min(0).max(10000000).nullable().default(null),
  }),
  campaigns: z
    .object({
      name: z.string().min(2).max(160),
      channel: z.enum(["Email", "Social", "Search", "Other"]),
      status: z.enum(["Draft", "Active", "Completed"]),
      budget: z.number().min(0).max(10000000),
      spend: z.number().min(0).max(10000000),
      impressions: z.number().int().min(0).default(0),
      startsOn: dateField,
      endsOn: dateField,
      landingUrl: httpsField,
      utmSource: z.string().trim().max(100).default(""),
      utmMedium: z.string().trim().max(100).default(""),
      utmCampaign: z.string().trim().max(160).default(""),
      clicks: z.number().int().min(0),
      conversions: z.number().int().min(0),
      revenue: z.number().min(0),
      notes: z.string().max(2000),
    })
    .refine((v) => !v.startsOn || !v.endsOn || v.endsOn >= v.startsOn, {
      message: "Campaign end date must follow its start date",
      path: ["endsOn"],
    }),
};
export type CommerceKind = keyof typeof recordSchemas;
export type CommerceRecord = {
  id: string;
  kind: CommerceKind;
  data: Record<string, unknown>;
  createdAt: string;
};
