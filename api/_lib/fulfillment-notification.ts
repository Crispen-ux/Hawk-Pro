import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../../db/index.ts";
import { commerce } from "../../db/schema.ts";
import { sendEmail } from "./email.ts";
import { secureToken } from "./checkout-common.ts";
import { siteUrl } from "./payflex-client.ts";
import { orderItems } from "../../db/checkout-model.ts";
import { safeTrackingUrl } from "../../db/store-operations.ts";
export async function notifyFulfillment(id: string) {
  const db = getDb();
  const [order] = await db
    .update(commerce)
    .set({
      data: sql`jsonb_set(jsonb_set(${commerce.data},'{fulfillmentEmail}','"sending"'::jsonb),'{fulfillmentEmailAttemptAt}',to_jsonb(${new Date().toISOString()}::text))`,
    })
    .where(
      and(
        eq(commerce.id, id),
        eq(commerce.kind, "orders"),
        sql`COALESCE(${commerce.data}->>'fulfillmentRevision','0')::int>0 AND (COALESCE(${commerce.data}->>'fulfillmentEmail','pending') IN ('pending','failed') OR (${commerce.data}->>'fulfillmentEmail'='sending' AND (${commerce.data}->>'fulfillmentEmailAttemptAt')::timestamptz<now()-interval '5 minutes'))`,
      ),
    )
    .returning();
  if (!order) return true;
  const d = order.data,
    rev = Number(d.fulfillmentRevision);
  let state = "sent";
  try {
    const link = siteUrl() + "/orders/" + id + "/" + secureToken(id, "guest");
    const tracking = safeTrackingUrl(d.trackingUrl);
    await sendEmail(
      String(d.email),
      "Your HAWK order: " + String(d.status),
      "Hi " +
        d.name +
        ",\nReference: HAWK-" +
        id.slice(0, 8).toUpperCase() +
        "\nOrder status: " +
        d.status +
        "\n" +
        orderItems(d)
          .map((i) => i.name + " × " + i.quantity)
          .join("\n") +
        (d.courier ? "\nCourier: " + d.courier : "") +
        (d.tracking ? "\nTracking reference: " + d.tracking : "") +
        (tracking ? "\nCourier tracking: " + tracking : "") +
        (d.estimatedDelivery
          ? "\nEstimated delivery: " +
            d.estimatedDelivery +
            " (subject to courier updates)"
          : "") +
        "\nView your order: " +
        link,
      id + "-fulfillment-" + rev,
    );
  } catch {
    state = "failed";
  }
  await db
    .update(commerce)
    .set({
      data: sql`jsonb_set(${commerce.data},'{fulfillmentEmail}',to_jsonb(${state}::text))`,
    })
    .where(
      and(
        eq(commerce.id, id),
        sql`(${commerce.data}->>'fulfillmentRevision')::int=${rev}`,
      ),
    );
  return state === "sent";
}
