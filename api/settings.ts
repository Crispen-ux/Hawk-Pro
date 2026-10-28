import { z } from "zod";
import { contentSchema } from "../db/website-content.ts";
import { getContentState, changeContent } from "../db/website-content-store.ts";
import { getSettings, saveSettings } from "../db/settings.ts";
import {
  getDocumentPayments,
  saveDocumentPayments,
} from "../db/document-payments.ts";
import { documentPaymentsSchema } from "../db/document-payments-validation.ts";
import { settingsSchema } from "../db/validation.ts";
import { parseBody, requireAdmin, sendJson, withErrors } from "./_lib/http.ts";

// GET /api/settings   announcement bar and contact block (public)
// PUT /api/settings   save them (admin)
export default withErrors(async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (
    new URL(req.url ?? "/", "http://localhost").searchParams.get("section") ===
    "website-content"
  ) {
    const admin =
      new URL(req.url ?? "/", "http://localhost").searchParams.get("admin") ===
      "1";
    if (req.method === "GET" && !admin) {
      const state = await getContentState();
      sendJson(res, 200, { content: state.published });
      return;
    }
    if (!(await requireAdmin(req, res))) return;
    if (req.method === "GET") {
      sendJson(res, 200, await getContentState());
      return;
    }
    if (req.method === "PUT") {
      const body = await parseBody(
        req,
        res,
        z.object({
          action: z.enum(["save", "publish", "restore"]),
          content: contentSchema,
          revision: z.number().int().min(0),
        }),
      );
      if (!body) return;
      const state = await changeContent(
        body.action,
        body.content,
        body.revision,
      );
      if (!state) {
        sendJson(res, 409, {
          error: "Content changed in another session. Reload before saving.",
        });
        return;
      }
      sendJson(res, 200, state);
      return;
    }
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }
  if (
    new URL(req.url ?? "/", "http://localhost").searchParams.get("section") ===
    "document-payments"
  ) {
    if (!(await requireAdmin(req, res))) return;
    if (req.method === "GET") {
      sendJson(res, 200, { payments: await getDocumentPayments() });
    } else if (req.method === "PUT") {
      const value = await parseBody(req, res, documentPaymentsSchema);
      if (!value) return;
      await saveDocumentPayments(value);
      sendJson(res, 200, { payments: value });
    } else sendJson(res, 405, { error: "Method not allowed" });
    return;
  }
  if (req.method === "GET") {
    sendJson(res, 200, { settings: await getSettings() });
    return;
  }

  if (req.method === "PUT") {
    if (!(await requireAdmin(req, res))) return;
    const body = await parseBody(req, res, settingsSchema);
    if (!body) return;
    await saveSettings(body);
    sendJson(res, 200, { settings: body });
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
});
