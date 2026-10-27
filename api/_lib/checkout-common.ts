import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { calculateDelivery, type DeliveryQuote } from "../../db/checkout-model";
import { listProducts } from "../../db/products";
import { getSettings } from "../../db/settings";
import type { EstimateInput, CheckoutInput } from "../../db/sales-validation";
import { payflexReady } from "./payflex-client";
import { allowAuth } from "./rate-limit";
import type { ApiRequest, ApiResponse } from "./http";
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export function secureToken(id: string, purpose: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("SESSION_SECRET is not configured");
  return createHmac("sha256", secret)
    .update(purpose + ":" + id)
    .digest("hex");
}
export function sameSecret(value: string, expected: string) {
  const a = Buffer.from(value),
    b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export async function checkoutRateLimit(
  req: ApiRequest,
  res: ApiResponse,
  limit = 30,
) {
  const origin = req.headers.origin;
  if (origin && new URL(origin).host !== req.headers.host) {
    res.statusCode = 403;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Cross-origin request rejected" }));
    return false;
  }
  const ip = String(
    req.headers["x-forwarded-for"] ?? req.socket?.remoteAddress ?? "local",
  )
    .split(",")[0]
    .trim()
    .slice(0, 100);
  if (
    !(await allowAuth(
      "checkout:" + hash(ip) + ":" + String(req.url ?? "").split("?")[0],
      limit,
      15 * 60000,
    ))
  ) {
    res.statusCode = 429;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "Too many requests. Please try again in a few minutes.",
      }),
    );
    return false;
  }
  return true;
}
export async function quoteFor(input: EstimateInput) {
  const [products, settings] = await Promise.all([
    listProducts({ publishedOnly: true }),
    getSettings(),
  ]);
  const selection = { lines: input.lines, destination: input.destination };
  const base = calculateDelivery(selection, products, settings.sales);
  if (base.payable && (!payflexReady() || !settings.onboardingCompleted)) {
    base.payable = false;
    base.message =
      "Online payment is not available yet. You can request a quote.";
  }
  const quote: DeliveryQuote = {
    ...base,
    quoteId: hash(JSON.stringify({ input: selection, quote: base })),
  };
  return { quote, settings };
}
export function checkoutHash(input: CheckoutInput) {
  return hash(
    JSON.stringify({
      lines: [...input.lines].sort((a, b) =>
        a.productId.localeCompare(b.productId),
      ),
      destination: input.destination,
      customer: input.customer,
      intent: input.intent,
      notes: input.notes,
      consent: input.consent,
    }),
  );
}
export function receipt(record: { id: string; data: Record<string, unknown> }) {
  const d = record.data;
  return {
    id: record.id,
    reference: "HAWK-" + record.id.slice(0, 8).toUpperCase(),
    items: d.items,
    subtotalCents: d.subtotalCents,
    shippingCents: d.shippingCents,
    totalCents: d.totalCents,
    payment: d.payment,
    paymentState: d.paymentState,
    status: d.status,
    quoteRequired: d.quoteRequired,
    delivery: d.delivery,
    confirmationEmail: d.confirmationEmail ?? "pending",
    priceOnRequest:
      (d.delivery as { priceOnRequest?: boolean } | undefined)
        ?.priceOnRequest ?? false,
    quoteAdjusted: d.quoteAdjusted === true,
  };
}
