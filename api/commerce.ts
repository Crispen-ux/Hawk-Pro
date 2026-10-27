import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db/index.ts";
import { commerce, products } from "../db/schema.ts";
import { recordSchemas, type CommerceKind } from "../db/commerce-validation.ts";
import { parseBody, requireAdmin, sendJson, withErrors } from "./_lib/http.ts";
import { dispatchOrder } from "./_lib/dispatch.ts";
import { sendEmail } from "./_lib/email.ts";
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
  const data: Record<string, unknown> = { ...parsed.data };
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
  if (body.kind === "orders") {
    if (!old && data.status !== "pending") {
      sendJson(res, 400, { error: "New orders must start as pending" });
      return;
    }
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, String(data.productId)));
    if (!product) {
      sendJson(res, 400, { error: "Product not found" });
      return;
    }
    // Prices are always computed by the server and then snapshotted for reporting.
    data.total = old
      ? old.data.total
      : product.priceZar * Number(data.quantity);
    data.productName = old?.data.productName ?? product.name;
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
  if (body.kind === "orders" && (!old || old.data.status !== data.status))
    try {
      await sendEmail(
        String(data.email),
        old
          ? "Your Hawk order has been updated"
          : "Your Hawk order confirmation",
        `Hi ${data.name},\nOrder ${record.id.slice(0, 8).toUpperCase()}\n${data.productName} × ${data.quantity}\nTotal: R ${Number(data.total).toFixed(2)}\nStatus: ${data.status}\n${data.tracking ? "Tracking: " + data.tracking : ""}`,
      );
    } catch {
      emailWarning =
        "Order saved, but email delivery failed. Check email configuration.";
    }
  sendJson(res, 200, { record, emailWarning });
});
