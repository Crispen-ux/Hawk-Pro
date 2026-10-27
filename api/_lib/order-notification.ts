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
      link = siteUrl() + "/orders/" + id + "/" + secureToken(id, "guest");
    } catch {
      /* Quote requests can be used before a public HTTPS origin is configured. */
    }
    await sendEmail(
      String(d.email),
      quote ? "We received your quote request" : "Your HAWK order is confirmed",
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
      {
        eyebrow: quote ? "Quote request" : "Order confirmation",
        preheader: quote
          ? "We have your request. Our team will confirm the details."
          : "Payment confirmed. We are getting your equipment ready.",
        intro:
          "Hi " +
          String(d.name) +
          ",\n" +
          (quote
            ? "Thank you for your interest in HAWK. We have received your quote request and will confirm availability, delivery costs and payment arrangements. No payment has been taken."
            : "Thank you for choosing HAWK. Your payment is confirmed and your order is with our team. We will keep you updated as it moves towards delivery."),
        items: orderItems(d).map((i) => ({
          name: i.name,
          quantity: i.quantity,
          detail: i.packLabel,
          amount: d.quoteAdjusted
            ? "Agreed quote"
            : i.unitPriceCents > 0
              ? "R " + (i.lineTotalCents / 100).toFixed(2)
              : "To be quoted",
        })),
        facts: [
          { label: "Reference", value: "HAWK-" + id.slice(0, 8).toUpperCase() },
          {
            label: quote ? "Payment" : "Total paid",
            value: quote
              ? "No payment taken"
              : "R " + (Number(d.totalCents) / 100).toFixed(2),
          },
        ],
        ...(link
          ? {
              action: {
                label: quote ? "View your request" : "View your order",
                url: link,
              },
            }
          : {}),
      },
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
