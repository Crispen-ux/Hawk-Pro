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
