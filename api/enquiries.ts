import { createEnquiry, listEnquiries } from "../db/enquiries.ts";
import { enquiryInputSchema } from "../db/validation.ts";
import { parseBody, requireAdmin, sendJson, withErrors } from "./_lib/http.ts";

// GET  /api/enquiries    admin inbox
// POST /api/enquiries    public: rental and repair forms
export default withErrors(async (req, res) => {
  if (req.method === "GET") {
    if (!await requireAdmin(req, res)) return;
    const rows = await listEnquiries();
    sendJson(res, 200, { enquiries: rows });
    return;
  }

  if (req.method === "POST") {
    const body = await parseBody(req, res, enquiryInputSchema);
    if (!body) return;
    const created = await createEnquiry({
      kind: body.kind,
      payload: body.payload,
    });
    sendJson(res, 201, { enquiry: created });
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
});


