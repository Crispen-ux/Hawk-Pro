import { z } from "zod";
import { setEnquiryStatus } from "../../db/enquiries.ts";
import { enquiryStatusSchema } from "../../db/validation.ts";
import { parseBody, requireAdmin, sendJson, withErrors } from "../_lib/http.ts";

const idSchema = z.string().uuid();

// PATCH /api/enquiries/:id   change status in the admin inbox
export default withErrors(async (req, res) => {
  if (req.method !== "PATCH") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }
  if (!await requireAdmin(req, res)) return;

  const rawId = req.query?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const parsedId = idSchema.safeParse(id ?? "");
  if (!parsedId.success) {
    sendJson(res, 400, { error: "Unknown enquiry id" });
    return;
  }

  const body = await parseBody(req, res, enquiryStatusSchema);
  if (!body) return;

  const updated = await setEnquiryStatus(parsedId.data, body.status);
  if (!updated) {
    sendJson(res, 404, { error: "Enquiry not found" });
    return;
  }
  sendJson(res, 200, { enquiry: updated });
});

