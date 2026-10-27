import { z } from "zod";
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
  }),
  campaigns: z.object({
    name: z.string().min(2).max(160),
    channel: z.enum(["Email", "Social", "Search", "Other"]),
    status: z.enum(["Draft", "Active", "Completed"]),
    budget: z.number().min(0).max(10000000),
    spend: z.number().min(0).max(10000000),
    clicks: z.number().int().min(0),
    conversions: z.number().int().min(0),
    revenue: z.number().min(0),
    notes: z.string().max(2000),
  }),
};
export type CommerceKind = keyof typeof recordSchemas;
export type CommerceRecord = {
  id: string;
  kind: CommerceKind;
  data: Record<string, unknown>;
  createdAt: string;
};
