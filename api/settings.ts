import { getSettings, saveSettings } from "../db/settings.ts";
import { settingsSchema } from "../db/validation.ts";
import { parseBody, requireAdmin, sendJson, withErrors } from "./_lib/http.ts";

// GET /api/settings   announcement bar and contact block (public)
// PUT /api/settings   save them (admin)
export default withErrors(async (req, res) => {
  if (req.method === "GET") {
    sendJson(res, 200, { settings: await getSettings() });
    return;
  }

  if (req.method === "PUT") {
    if (!await requireAdmin(req, res)) return;
    const body = await parseBody(req, res, settingsSchema);
    if (!body) return;
    await saveSettings(body);
    sendJson(res, 200, { settings: body });
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
});


