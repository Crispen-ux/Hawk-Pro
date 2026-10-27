import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../../db/index.ts";
import { commerce } from "../../db/schema.ts";
import { toCents } from "../../db/checkout-model.ts";
import { getPayflexOrder, type payflexOrderSchema } from "./payflex-client.ts";
import { adjustOrderStock } from "./stock-orders.ts";
import { notifyOrder } from "./order-notification.ts";
import type { z } from "zod";
export function verifyPayflexOrder(
  remote: z.infer<typeof payflexOrderSchema>,
  local: { id: string; data: Record<string, unknown> },
) {
  if (
    remote.merchantReference !== local.id ||
    toCents(remote.amount) !== Number(local.data.totalCents) ||
    (local.data.payflexOrderId && remote.orderId !== local.data.payflexOrderId)
  )
    throw new Error("Payflex order does not match the stored order");
}
export async function reconcilePayflex(id: string, providedId?: string) {
  const db = getDb();
  for (let attempt = 0; attempt < 3; attempt++) {
    const [order] = await db
      .select()
      .from(commerce)
      .where(and(eq(commerce.id, id), eq(commerce.kind, "orders")));
    if (!order) throw new Error("Order not found");
    if (
      order.data.quoteRequired === true ||
      order.data.paymentProvider !== "payflex"
    )
      return { order, emailDelivered: await notifyOrder(id) };
    const remoteId = String(order.data.payflexOrderId ?? providedId ?? "");
    if (!remoteId) return { order, emailDelivered: true };
    const remote = await getPayflexOrder(remoteId);
    verifyPayflexOrder(remote, order);
    // Approved is terminal locally: an older event can never mark a paid order unpaid.
    if (order.data.payment === "paid")
      return { order, emailDelivered: await notifyOrder(id) };
    const next = {
      ...order.data,
      payflexOrderId: remote.orderId,
      paymentState: remote.orderStatus.toLowerCase(),
      paymentCheckedAt: new Date().toISOString(),
    };
    if (remote.orderStatus === "Approved") {
      if (order.data.stockReserved !== true)
        throw new Error(
          "Approved payment requires manual stock reconciliation",
        );
      const [saved] = await db
        .update(commerce)
        .set({
          data: {
            ...next,
            payment: "paid",
            paidAt: new Date().toISOString(),
            confirmationEmail: "pending",
          },
        })
        .where(
          and(
            eq(commerce.id, id),
            sql`${commerce.data}=${JSON.stringify(order.data)}::jsonb`,
          ),
        )
        .returning();
      if (!saved) continue;
      return { order: saved, emailDelivered: await notifyOrder(id) };
    }
    if (
      remote.orderStatus === "Declined" ||
      remote.orderStatus === "Abandoned"
    ) {
      const saved = await adjustOrderStock(
        id,
        order.data,
        { ...next, status: "cancelled", payment: "unpaid" },
        "release",
      );
      if (!saved) continue;
      return { order: saved, emailDelivered: true };
    }
    const [saved] = await db
      .update(commerce)
      .set({ data: next })
      .where(
        and(
          eq(commerce.id, id),
          sql`${commerce.data}=${JSON.stringify(order.data)}::jsonb`,
        ),
      )
      .returning();
    if (!saved) continue;
    return { order: saved, emailDelivered: true };
  }
  throw new Error("Order changed during payment reconciliation. Please retry.");
}
