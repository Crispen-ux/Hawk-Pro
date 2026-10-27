import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../db/index";
import { commerce } from "../db/schema";
import { checkoutInputSchema } from "../db/sales-validation";
import { parseBody, sendJson, withErrors } from "./_lib/http";
import {
  checkoutRateLimit,
  checkoutHash,
  quoteFor,
  receipt,
  secureToken,
} from "./_lib/checkout-common";
import {
  createPayflexOrder,
  PayflexRejected,
  payflexReady,
  siteUrl,
} from "./_lib/payflex-client";
import { reserveOrder, adjustOrderStock } from "./_lib/stock-orders";
import { notifyOrder } from "./_lib/order-notification";
export default withErrors(async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }
  if (!(await checkoutRateLimit(req, res, 15))) return;
  const input = await parseBody(req, res, checkoutInputSchema);
  if (!input) return;
  if (
    input.intent === "pay" &&
    !input.customer.billingSame &&
    (!input.customer.billingAddressLine1 ||
      !input.customer.billingCity ||
      !/^\d{4}$/.test(input.customer.billingPostcode) ||
      input.customer.billingCountry !== "ZA")
  ) {
    sendJson(res, 400, {
      error: "Enter your complete South African billing address.",
    });
    return;
  }
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    sendJson(res, 503, {
      error: "Store checkout is not configured yet. Please contact the store.",
    });
    return;
  }
  const db = getDb(),
    fingerprint = checkoutHash(input);
  const [existing] = await db
    .select()
    .from(commerce)
    .where(eq(commerce.id, input.key));
  if (existing) {
    if (
      existing.kind !== "orders" ||
      existing.data.checkoutHash !== fingerprint
    ) {
      sendJson(res, 409, {
        error:
          "This checkout attempt has changed. Please review your cart and try again.",
      });
      return;
    }
    sendJson(res, 200, {
      receipt: receipt(existing),
      access: secureToken(existing.id, "guest"),
      redirectUrl:
        existing.data.payment === "paid" || existing.data.status === "cancelled"
          ? null
          : (existing.data.payflexUrl ?? null),
      reused: true,
    });
    return;
  }
  const { quote, settings } = await quoteFor(input);
  if (quote.quoteId !== input.quoteId) {
    sendJson(res, 409, {
      error:
        "The price, stock or delivery estimate changed. Refresh the estimate before continuing.",
    });
    return;
  }
  if (input.intent === "pay" && (!quote.payable || !payflexReady())) {
    sendJson(res, 409, { error: quote.message });
    return;
  }
  const name = input.customer.name;
  const address = [
    input.customer.addressLine1,
    input.customer.addressLine2,
    input.customer.suburb,
    input.customer.city,
    input.customer.province,
    input.destination.postcode,
    input.destination.country,
  ]
    .filter(Boolean)
    .join(", ");
  const isQuote = input.intent === "quote";
  const data: Record<string, unknown> = {
    checkoutHash: fingerprint,
    source: "storefront",
    name,
    email: input.customer.email,
    phone: input.customer.phone,
    address,
    customer: input.customer,
    destination: input.destination,
    items: quote.items,
    productId: quote.items[0].productId,
    productName: quote.items.map((i) => i.name).join(", "),
    quantity: quote.items.reduce((sum, i) => sum + i.quantity, 0),
    subtotalCents: quote.subtotalCents,
    shippingCents: quote.shippingCents,
    totalCents: quote.totalCents ?? quote.subtotalCents,
    total: (quote.totalCents ?? quote.subtotalCents) / 100,
    taxIncludedCents: quote.taxIncludedCents,
    delivery: quote,
    notes: input.notes,
    status: "pending",
    payment: "unpaid",
    paymentProvider: isQuote ? null : "payflex",
    paymentState: isQuote ? "quote-requested" : "starting",
    quoteRequired: isQuote,
    stockReserved: !isQuote,
    tracking: "",
    confirmationEmail: "pending",
  };
  let order;
  if (isQuote) {
    [order] = await db
      .insert(commerce)
      .values({ id: input.key, kind: "orders", data })
      .onConflictDoNothing()
      .returning();
  } else order = await reserveOrder(input.key, data);
  if (!order) {
    const [duplicate] = await db
      .select()
      .from(commerce)
      .where(eq(commerce.id, input.key));
    if (
      duplicate?.kind === "orders" &&
      duplicate.data.checkoutHash === fingerprint
    ) {
      sendJson(res, 200, {
        receipt: receipt(duplicate),
        access: secureToken(duplicate.id, "guest"),
        redirectUrl:
          duplicate.data.payment === "paid" ||
          duplicate.data.status === "cancelled"
            ? null
            : (duplicate.data.payflexUrl ?? null),
        reused: true,
      });
      return;
    }
    sendJson(res, 409, {
      error:
        "Stock or product details changed. Please refresh your cart and delivery estimate.",
    });
    return;
  }
  if (isQuote) {
    const delivered = await notifyOrder(order.id);
    sendJson(res, 201, {
      receipt: receipt(order),
      access: secureToken(order.id, "guest"),
      redirectUrl: null,
      emailWarning: delivered
        ? undefined
        : "Your request is saved. The confirmation email is awaiting delivery.",
    });
    return;
  }
  try {
    const origin = siteUrl(),
      access = secureToken(order.id, "guest");
    const shipping = {
      addressLine1: input.customer.addressLine1,
      addressLine2: input.customer.addressLine2,
      suburb: input.customer.suburb,
      city: input.customer.city,
      state: input.customer.province,
      postcode: input.destination.postcode,
    };
    const billing = input.customer.billingSame
      ? shipping
      : {
          addressLine1: input.customer.billingAddressLine1,
          addressLine2: "",
          suburb: "",
          city: input.customer.billingCity,
          state: input.customer.billingProvince,
          postcode: input.customer.billingPostcode,
        };
    const parts = name.split(/\s+/);
    const remote = await createPayflexOrder({
      amount: Number(data.totalCents) / 100,
      consumer: {
        givenNames: parts.slice(0, -1).join(" ") || parts[0],
        surname: parts.length > 1 ? parts[parts.length - 1] : "",
        email: input.customer.email,
        phoneNumber: input.customer.phone,
      },
      billing,
      shipping,
      description: "HAWK " + order.id,
      items: quote.items.map((i) => ({
        name: i.name,
        description: i.name,
        sku: i.sku,
        quantity: i.quantity,
        price: i.unitPriceCents / 100,
      })),
      merchant: {
        redirectConfirmUrl:
          origin + "/checkout/return/" + order.id + "/" + access,
        redirectCancelUrl:
          origin + "/checkout/return/" + order.id + "/" + access,
        statusCallbackUrl:
          origin +
          "/api/payflex?order=" +
          order.id +
          "&callback=" +
          secureToken(order.id, "callback"),
      },
      merchantReference: order.id,
      taxAmount: quote.taxIncludedCents / 100,
      shippingAmount: Number(quote.shippingCents) / 100,
    });
    const remoteFields = {
      payflexOrderId: remote.orderId,
      payflexUrl: remote.redirectUrl,
      payflexExpiry: remote.expiryDateTime ?? null,
    };
    const [saved] = await db
      .update(commerce)
      .set({
        data: sql`${commerce.data} || ${JSON.stringify(remoteFields)}::jsonb || CASE WHEN ${commerce.data}->>'paymentState'='starting' THEN '{"paymentState":"pending"}'::jsonb ELSE '{}'::jsonb END`,
      })
      .where(and(eq(commerce.id, order.id), eq(commerce.kind, "orders")))
      .returning();
    sendJson(res, 201, {
      receipt: receipt(saved),
      access,
      redirectUrl: saved.data.payment === "paid" ? null : remote.redirectUrl,
    });
  } catch (e) {
    const [current] = await db
      .select()
      .from(commerce)
      .where(eq(commerce.id, order.id));
    if (
      current &&
      current.data.payment !== "paid" &&
      !["declined", "abandoned"].includes(String(current.data.paymentState))
    ) {
      if (e instanceof PayflexRejected) {
        await adjustOrderStock(
          order.id,
          current.data,
          {
            ...current.data,
            status: "cancelled",
            paymentState: "setup-failed",
          },
          "release",
        );
      } else {
        await db
          .update(commerce)
          .set({ data: { ...current.data, paymentState: "needs-review" } })
          .where(
            and(
              eq(commerce.id, order.id),
              sql`${commerce.data}=${JSON.stringify(current.data)}::jsonb`,
            ),
          );
      }
    }
    sendJson(res, 502, {
      error:
        e instanceof PayflexRejected
          ? e.message
          : "Your order is saved, but the payment session could not be confirmed. Please contact the store with reference HAWK-" +
            order.id.slice(0, 8).toUpperCase() +
            ". We will check it before another payment attempt.",
      reference: "HAWK-" + order.id.slice(0, 8).toUpperCase(),
      savedOrder: { id: order.id, access: secureToken(order.id, "guest") },
    });
  }
});
