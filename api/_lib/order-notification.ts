import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../../db/index.ts";
import { commerce } from "../../db/schema.ts";
import { orderItems } from "../../db/checkout-model.ts";
import { sendEmail } from "./email.ts";
import { secureToken } from "./checkout-common.ts";
import { siteUrl } from "./payflex-client.ts";
export async function notifyOrder(id: string) {
  const db = getDb();
  const [claimed] = await db
    .update(commerce)
    .set({
      data: sql`jsonb_set(jsonb_set(${commerce.data},'{confirmationEmail}','"sending"'::jsonb),'{emailAttemptAt}',to_jsonb(${new Date().toISOString()}::text))`,
    })
    .where(
      and(
        eq(commerce.id, id),
        eq(commerce.kind, "orders"),
        sql`(${commerce.data}->>'payment'='paid' OR ${commerce.data}->>'quoteRequired'='true') AND (COALESCE(${commerce.data}->>'confirmationEmail','pending') IN ('pending','failed') OR (${commerce.data}->>'confirmationEmail'='sending' AND (${commerce.data}->>'emailAttemptAt')::timestamptz < now()-interval '5 minutes'))`,
      ),
    )
    .returning();
  if (!claimed) return true;
  const d = claimed.data;
  try {
    const quote = d.quoteRequired === true;
    const lines = orderItems(d)
      .map(
        (i) =>
          i.name +
          (i.packLabel ? " (" + i.packLabel + ")" : "") +
          " × " +
          i.quantity,
      )
      .join("\n");
    let link = "";
    try {
      link =
        siteUrl() + "/checkout/return/" + id + "/" + secureToken(id, "guest");
    } catch {
      /* Quote requests can be used before a public HTTPS origin is configured. */
    }
    await sendEmail(
      String(d.email),
      quote ? "Your Hawk quote request" : "Your Hawk order confirmation",
      "Hi " +
        d.name +
        ",\n" +
        (quote
          ? "We received your quote request. No payment has been taken."
          : "Your payment has been confirmed. We are preparing your order.") +
        "\nReference: HAWK-" +
        id.slice(0, 8).toUpperCase() +
        "\n" +
        lines +
        "\n" +
        (quote
          ? "Delivery and payment arrangements will be confirmed by our team."
          : "Total: R " + (Number(d.totalCents) / 100).toFixed(2)) +
        (link ? "\nView your order: " + link : ""),
      id + "-" + (quote ? "quote" : "paid"),
    );
    await db
      .update(commerce)
      .set({
        data: sql`jsonb_set(${commerce.data},'{confirmationEmail}','"sent"'::jsonb)`,
      })
      .where(eq(commerce.id, id));
    return true;
  } catch {
    await db
      .update(commerce)
      .set({
        data: sql`jsonb_set(${commerce.data},'{confirmationEmail}','"failed"'::jsonb)`,
      })
      .where(eq(commerce.id, id));
    return false;
  }
}
