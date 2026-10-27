import { notifyFulfillment } from "./_lib/fulfillment-notification.ts";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getDb } from "../db/index.ts";
import { commerce } from "../db/schema.ts";
import { parseBody, requireAdmin, sendJson, withErrors } from "./_lib/http.ts";
import {
  receipt,
  sameSecret,
  secureToken,
  checkoutRateLimit,
} from "./_lib/checkout-common.ts";
import { reconcilePayflex } from "./_lib/payflex-reconcile.ts";
export default withErrors(async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") {
    const id = z.uuid().safeParse(req.query?.order);
    const access = String(req.query?.access ?? "");
    if (!id.success || !sameSecret(access, secureToken(id.data, "guest"))) {
      sendJson(res, 404, { error: "Order not found" });
      return;
    }
    if (!(await checkoutRateLimit(req, res, 150))) return;
    try {
      if (req.query?.tracking === "1") {
        const [order] = await getDb()
          .select()
          .from(commerce)
          .where(and(eq(commerce.id, id.data), eq(commerce.kind, "orders")));
        if (!order) {
          sendJson(res, 404, { error: "Order not found" });
          return;
        }
        sendJson(res, 200, { receipt: receipt(order) });
        return;
      }
      const result = await reconcilePayflex(id.data);
      sendJson(res, 200, {
        receipt: receipt(result.order),
        resumeUrl:
          result.order.data.payment !== "paid" &&
          ["created", "initiated", "pending"].includes(
            String(result.order.data.paymentState),
          )
            ? (result.order.data.payflexUrl ?? null)
            : null,
        emailWarning: result.emailDelivered
          ? undefined
          : "Confirmation email is awaiting delivery.",
      });
    } catch {
      sendJson(res, 503, {
        error:
          "Payment status could not be verified yet. Please retry. Your cart and payment are not submitted again.",
      });
    }
    return;
  }
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }
  const isCallback = typeof req.query?.callback === "string";
  if (isCallback) {
    const id = z.uuid().safeParse(req.query?.order);
    if (
      !id.success ||
      !sameSecret(String(req.query?.callback), secureToken(id.data, "callback"))
    ) {
      sendJson(res, 403, { error: "Invalid callback" });
      return;
    }
    const input = await parseBody(req, res, z.object({ orderId: z.uuid() }));
    if (!input) return;
    const result = await reconcilePayflex(id.data, input.orderId);
    sendJson(res, result.emailDelivered ? 200 : 503, {
      ok: result.emailDelivered,
    });
    return;
  }
  if (!(await requireAdmin(req, res))) return;
  const body = await parseBody(
    req,
    res,
    z.object({
      id: z.uuid(),
      providerOrderId: z.uuid().optional(),
      notification: z.literal("fulfillment").optional(),
    }),
  );
  if (!body) return;
  if (body.notification === "fulfillment") {
    const delivered = await notifyFulfillment(body.id);
    sendJson(res, 200, {
      emailWarning: delivered
        ? undefined
        : "Status email is still awaiting delivery.",
    });
    return;
  }
  const result = await reconcilePayflex(body.id, body.providerOrderId);
  sendJson(res, 200, {
    receipt: receipt(result.order),
    emailWarning: result.emailDelivered
      ? undefined
      : "Confirmation email is awaiting delivery.",
  });
});
