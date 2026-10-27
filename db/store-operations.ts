import type { CommerceRecord } from "./commerce-validation.ts";
import { orderItems } from "./checkout-model.ts";
export const amount = (v: unknown) =>
  Number.isFinite(Number(v)) ? Number(v) : 0;
export const availableStock = (d: Record<string, unknown>) =>
  Math.max(0, amount(d.quantity) - amount(d.reserved));
export function safeTrackingUrl(value: unknown) {
  if (typeof value !== "string" || !value) return "";
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password ? u.href : "";
  } catch {
    return "";
  }
}
export type FulfillmentEvent = { status: string; at: string };
export function fulfillmentEvents(value: unknown): FulfillmentEvent[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (e): e is FulfillmentEvent =>
        !!e &&
        typeof e === "object" &&
        ["pending", "processing", "shipped", "delivered", "cancelled"].includes(
          e.status,
        ) &&
        typeof e.at === "string" &&
        Number.isFinite(Date.parse(e.at)),
    )
    .slice(-100);
}
export function updateFulfillment(
  old: Record<string, unknown> | undefined,
  next: Record<string, unknown>,
  now = new Date().toISOString(),
) {
  const events = fulfillmentEvents(old?.fulfillmentEvents);
  if (!old || old.status !== next.status)
    events.push({ status: String(next.status), at: now });
  const changed =
    !old ||
    ["status", "tracking", "courier", "trackingUrl", "estimatedDelivery"].some(
      (k) => (old[k] ?? "") !== (next[k] ?? ""),
    );
  return {
    ...next,
    fulfillmentEvents: events,
    ...(changed
      ? {
          fulfillmentRevision: amount(old?.fulfillmentRevision) + 1,
          fulfillmentEmail: "pending",
        }
      : {}),
  };
}
export function campaignMetrics(d: Record<string, unknown>) {
  const spend = amount(d.spend),
    revenue = amount(d.revenue),
    clicks = amount(d.clicks),
    impressions = amount(d.impressions),
    conversions = amount(d.conversions),
    budget = amount(d.budget);
  return {
    roas: spend ? revenue / spend : null,
    ctr: impressions ? (100 * clicks) / impressions : null,
    conversionRate: clicks ? (100 * conversions) / clicks : null,
    cpc: clicks ? spend / clicks : null,
    cpa: conversions ? spend / conversions : null,
    budgetUsed: budget ? (100 * spend) / budget : null,
    remainingBudget: Math.max(0, budget - spend),
  };
}
export function campaignLink(d: Record<string, unknown>) {
  try {
    const u = new URL(String(d.landingUrl));
    if (!["https:", "http:"].includes(u.protocol) || u.username || u.password)
      return "";
    u.searchParams.set(
      "utm_source",
      String(d.utmSource || d.channel || "other").toLowerCase(),
    );
    u.searchParams.set("utm_medium", String(d.utmMedium || "campaign"));
    u.searchParams.set("utm_campaign", String(d.utmCampaign || d.name || ""));
    return u.href;
  } catch {
    return "";
  }
}
export function csvText(rows: unknown[][]) {
  return (
    "\uFEFF" +
    rows
      .map((row) =>
        row
          .map((value) => {
            let s = String(value ?? "");
            if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
            return '"' + s.replaceAll('"', '""') + '"';
          })
          .join(","),
      )
      .join("\r\n")
  );
}
export type CustomerProfile = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  consent: boolean;
  orders: CommerceRecord[];
  spent: number;
  paidOrders: number;
  lastOrder: string;
  segment: string;
};
export function customerProfiles(records: CommerceRecord[]): CustomerProfile[] {
  const map = new Map<string, CustomerProfile>();
  const ensure = (email: string, name: string, phone: string) => {
    const key = email.trim().toLowerCase();
    if (!key) return;
    let p = map.get(key);
    if (!p) {
      p = {
        name,
        email: key,
        phone,
        notes: "",
        consent: false,
        orders: [],
        spent: 0,
        paidOrders: 0,
        lastOrder: "",
        segment: "Prospect",
      };
      map.set(key, p);
    }
    return p;
  };
  for (const r of records.filter((r) => r.kind === "orders")) {
    const p = ensure(
      String(r.data.email ?? ""),
      String(r.data.name ?? ""),
      String(r.data.phone ?? ""),
    );
    if (!p) continue;
    p.orders.push(r);
    if (r.createdAt > p.lastOrder) p.lastOrder = r.createdAt;
    if (r.data.marketingConsent === true) p.consent = true;
    if (r.data.payment === "paid" && r.data.status !== "cancelled") {
      p.spent += amount(r.data.total);
      p.paidOrders++;
    }
  }
  for (const r of records.filter((r) => r.kind === "customers")) {
    const p = ensure(
      String(r.data.email ?? ""),
      String(r.data.name ?? ""),
      String(r.data.phone ?? ""),
    );
    if (!p) continue;
    Object.assign(p, {
      id: r.id,
      name: String(r.data.name),
      phone: String(r.data.phone ?? ""),
      notes: String(r.data.notes ?? ""),
      consent: r.data.consent === true,
    });
  }
  return [...map.values()]
    .map((p) => ({
      ...p,
      orders: p.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      segment:
        p.paidOrders > 1
          ? "Returning"
          : p.paidOrders === 1
            ? "First purchase"
            : p.orders.length
              ? "Enquiry / unpaid"
              : "Prospect",
    }))
    .sort(
      (a, b) =>
        b.lastOrder.localeCompare(a.lastOrder) || a.name.localeCompare(b.name),
    );
}
export function salesReport(
  records: CommerceRecord[],
  from: string,
  to: string,
) {
  const start = Date.parse(from + "T00:00:00+02:00"),
    end = Date.parse(to + "T23:59:59.999+02:00");
  const all = records.filter((r) => r.kind === "orders");
  const created = all.filter((r) => {
    const t = Date.parse(r.createdAt);
    return t >= start && t <= end;
  });
  const paid = all.filter(
    (r) =>
      (r.data.payment === "paid" || r.data.payment === "refunded") &&
      (r.data.status !== "cancelled" || r.data.payment === "refunded") &&
      Date.parse(String(r.data.paidAt || r.createdAt)) >= start &&
      Date.parse(String(r.data.paidAt || r.createdAt)) <= end,
  );
  const refunded = all.filter(
    (r) =>
      r.data.payment === "refunded" &&
      Date.parse(String(r.data.refundedAt || r.createdAt)) >= start &&
      Date.parse(String(r.data.refundedAt || r.createdAt)) <= end,
  );
  const revenue = paid.reduce((s, r) => s + amount(r.data.total), 0),
    refunds = refunded.reduce((s, r) => s + amount(r.data.total), 0);
  const shipping = paid.reduce(
      (s, r) => s + amount(r.data.shippingCents) / 100,
      0,
    ),
    tax = paid.reduce((s, r) => s + amount(r.data.taxIncludedCents) / 100, 0);
  const top = new Map<string, { name: string; quantity: number }>();
  for (const r of paid)
    for (const i of orderItems(r.data)) {
      const p = top.get(i.productId) || {
        name: i.name || String(r.data.productName || "Product"),
        quantity: 0,
      };
      p.quantity += i.quantity;
      top.set(i.productId, p);
    }
  return {
    created,
    paid,
    refunded,
    revenue,
    refunds,
    netReceipts: revenue - refunds,
    shipping,
    tax,
    goodsRevenue: revenue - shipping,
    average: paid.length ? revenue / paid.length : 0,
    units: [...top.values()].reduce((s, p) => s + p.quantity, 0),
    top: [...top.values()].sort((a, b) => b.quantity - a.quantity),
    quotes: created.filter((r) => r.data.quoteRequired === true).length,
    outstanding: created
      .filter(
        (r) => r.data.payment === "unpaid" && r.data.status !== "cancelled",
      )
      .reduce((s, r) => s + amount(r.data.total), 0),
  };
}
