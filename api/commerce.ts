import { orderItems, toCents } from "../db/checkout-model";
import { notifyOrder } from "./_lib/order-notification";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db/index.ts";
import { commerce, products } from "../db/schema.ts";
import { recordSchemas, type CommerceKind } from "../db/commerce-validation.ts";
import { parseBody, requireAdmin, sendJson, withErrors } from "./_lib/http.ts";
import { dispatchOrder } from "./_lib/dispatch.ts";
import { notifyFulfillment } from "./_lib/fulfillment-notification";
import { updateFulfillment, amount } from "../db/store-operations";
export default withErrors(async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!(await requireAdmin(req, res))) return;
  const db = getDb();
  if (req.method === "GET") {
    sendJson(res, 200, {
      records: await db
        .select()
        .from(commerce)
        .orderBy(desc(commerce.createdAt)),
    });
    return;
  }
  if (!["POST", "PUT"].includes(req.method ?? "")) {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }
  const body = await parseBody(
    req,
    res,
    z.object({
      kind: z.enum(["orders", "customers", "inventory", "campaigns"]),
      id: z.uuid().optional(),
      data: z.record(z.string(), z.unknown()),
    }),
  );
  if (!body) return;
  const parsed = recordSchemas[body.kind as CommerceKind].safeParse(body.data);
  if (!parsed.success) {
    sendJson(res, 400, { error: parsed.error.issues[0].message });
    return;
  }
  let data: Record<string, unknown> = { ...parsed.data };
  let old: typeof commerce.$inferSelect | undefined;
  if (body.id) {
    [old] = await db
      .select()
      .from(commerce)
      .where(and(eq(commerce.id, body.id), eq(commerce.kind, body.kind)));
    if (!old) {
      sendJson(res, 404, { error: "Record not found" });
      return;
    }
  }
  if (old) data = { ...old.data, ...data };
  if (body.kind === "inventory") {
    const changed = !old || data.quantity !== old.data.quantity;
    if (changed && !String(data.adjustmentReason ?? "").trim()) {
      sendJson(res, 400, { error: "Add a reason for this stock adjustment." });
      return;
    }
    if (old && old.data.productId !== data.productId) {
      sendJson(res, 400, {
        error: "A stock record cannot be moved to a different product.",
      });
      return;
    }
    if (changed)
      data.movements = [
        ...(Array.isArray(old?.data.movements) ? old.data.movements : []).slice(
          -99,
        ),
        {
          at: new Date().toISOString(),
          delta: amount(data.quantity) - amount(old?.data.quantity),
          balance: data.quantity,
          reason: data.adjustmentReason,
          type: "adjustment",
        },
      ];
  }
  if (body.kind === "inventory" && old) {
    const reserved = Number(old.data.reserved ?? 0);
    if (Number(data.quantity) < reserved) {
      sendJson(res, 409, {
        error:
          "Stock on hand cannot be reduced below the quantity reserved by checkout.",
      });
      return;
    }
    data.reserved = reserved;
  }
  if (body.kind === "orders") {
    if (!old && data.status !== "pending") {
      sendJson(res, 400, { error: "New orders must start as pending" });
      return;
    }
    if (old?.data.source === "storefront") {
      if (
        data.productId !== old.data.productId ||
        data.quantity !== old.data.quantity ||
        data.name !== old.data.name ||
        data.email !== old.data.email ||
        data.address !== old.data.address
      ) {
        sendJson(res, 400, {
          error:
            "Web order items and customer details cannot be changed after checkout.",
        });
        return;
      }
      if (
        old.data.paymentProvider === "payflex" &&
        data.payment !== old.data.payment
      ) {
        sendJson(res, 400, {
          error:
            "Payflex payments must be verified using Refresh Payflex status.",
        });
        return;
      }
      if (
        old.data.paymentProvider === "payflex" &&
        data.status === "cancelled" &&
        old.data.status !== "cancelled"
      ) {
        sendJson(res, 400, {
          error:
            "Refresh Payflex status for abandoned payments. Refunds are managed in Payflex; automatic refund synchronization is not included in this release.",
        });
        return;
      }
      if (
        ["processing", "shipped", "delivered"].includes(String(data.status)) &&
        data.payment !== "paid"
      ) {
        sendJson(res, 400, {
          error:
            "Confirm payment before processing or dispatching a web order.",
        });
        return;
      }
      if (
        old.data.quoteRequired === true &&
        typeof data.goodsQuoteZar === "number"
      ) {
        data.subtotalCents = toCents(data.goodsQuoteZar);
        data.totalCents =
          data.shippingCents === null
            ? null
            : Number(data.subtotalCents) + Number(data.shippingCents);
        data.quoteAdjusted = true;
      }
      if (
        old.data.quoteRequired === true &&
        typeof data.deliveryQuoteZar === "number"
      ) {
        data.shippingCents = toCents(data.deliveryQuoteZar);
        data.totalCents =
          Number(data.subtotalCents ?? old.data.subtotalCents) +
          Number(data.shippingCents);
        data.total = Number(data.totalCents) / 100;
      }
      if (old.data.quoteRequired === true && data.payment === "paid") {
        if (
          orderItems(old.data).some((i) => i.unitPriceCents <= 0) &&
          typeof data.goodsQuoteZar !== "number"
        ) {
          sendJson(res, 400, {
            error:
              "Enter the agreed goods subtotal for unpriced items before recording payment.",
          });
          return;
        }
        if (typeof data.deliveryQuoteZar !== "number") {
          sendJson(res, 400, {
            error:
              "Enter the agreed delivery charge before recording a quote as paid.",
          });
          return;
        }
        data.quoteRequired = false;
        data.confirmationEmail = "pending";
      }
    }
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, String(data.productId)));
    if (!product && !old) {
      sendJson(res, 400, { error: "Product not found" });
      return;
    }
    // Prices are always computed by the server and then snapshotted for reporting.
    data.total = old
      ? old.data.quoteRequired === true &&
        (typeof data.deliveryQuoteZar === "number" ||
          typeof data.goodsQuoteZar === "number")
        ? Number(data.totalCents ?? data.subtotalCents) / 100
        : old.data.total
      : product!.priceZar * Number(data.quantity);
    data.productName = old?.data.productName ?? product!.name;
    if (
      old &&
      (data.productId !== old.data.productId ||
        data.quantity !== old.data.quantity)
    ) {
      sendJson(res, 400, {
        error: "Order line items cannot be changed after creation",
      });
      return;
    }
    if (data.payment === "paid" && old?.data.payment !== "paid")
      data.paidAt = new Date().toISOString();
    if (data.payment === "refunded" && old?.data.payment !== "refunded")
      data.refundedAt = new Date().toISOString();
    data = updateFulfillment(old?.data, data);
    const allowed: Record<string, string[]> = {
      pending: ["pending", "processing", "cancelled"],
      processing: ["processing", "shipped", "cancelled"],
      shipped: ["shipped", "delivered"],
      delivered: ["delivered"],
      cancelled: ["cancelled"],
    };
    if (
      old &&
      !allowed[String(old.data.status)]?.includes(String(data.status))
    ) {
      sendJson(res, 400, { error: "Invalid fulfillment transition" });
      return;
    }
  }
  if (body.kind === "inventory" && !body.id) {
    const existing = await db
      .select()
      .from(commerce)
      .where(eq(commerce.kind, "inventory"));
    if (existing.some((r) => r.data.productId === data.productId)) {
      sendJson(res, 409, {
        error: "Edit the existing stock record for this product",
      });
      return;
    }
  }
  if (body.kind === "customers") {
    const customers = await db
      .select()
      .from(commerce)
      .where(eq(commerce.kind, "customers"));
    if (
      customers.some(
        (r) =>
          r.id !== old?.id && String(r.data.email).toLowerCase() === data.email,
      )
    ) {
      sendJson(res, 409, {
        error:
          "A customer with this email already exists. Edit their existing record.",
      });
      return;
    }
    if (!old || data.consent !== old.data.consent)
      data.marketingPreferenceAt = new Date().toISOString();
  }
  if (body.kind === "inventory" && !old) {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, String(data.productId)));
    if (!product) {
      sendJson(res, 400, { error: "Product not found" });
      return;
    }
  }
  let record;
  if (
    old &&
    body.kind === "orders" &&
    old.data.status === "processing" &&
    data.status === "shipped"
  ) {
    record = await dispatchOrder(old.id, old.data, data);
    if (!record) {
      sendJson(res, 409, {
        error:
          "Insufficient stock, missing stock record, or order changed. Refresh and check inventory.",
      });
      return;
    }
  } else {
    [record] = old
      ? await db
          .update(commerce)
          .set({ data })
          .where(
            and(
              eq(commerce.id, old.id),
              sql`${commerce.data}=${JSON.stringify(old.data)}::jsonb`,
            ),
          )
          .returning()
      : await db.insert(commerce).values({ kind: body.kind, data }).returning();
    if (!record) {
      sendJson(res, 409, {
        error: "Record changed. Refresh before editing again.",
      });
      return;
    }
  }
  let emailWarning: string | undefined;
  if (
    body.kind === "orders" &&
    old?.data.source === "storefront" &&
    old.data.payment !== "paid" &&
    data.payment === "paid"
  ) {
    if (!(await notifyOrder(record.id)))
      emailWarning =
        "Payment recorded; the confirmation email is awaiting delivery.";
  }
  if (body.kind === "orders" && record.data.fulfillmentEmail === "pending") {
    if (!(await notifyFulfillment(record.id)))
      emailWarning =
        "Order saved. Its status email is awaiting delivery; retry it from Orders.";
  }
  sendJson(res, 200, { record, emailWarning });
});
