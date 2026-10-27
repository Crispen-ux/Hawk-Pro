import { z } from "zod";
import {
  expectedPasscode,
  isValidPasscode,
  parseBody,
  sendJson,
  withErrors,
} from "./_lib/http.ts";

const bodySchema = z.object({ passcode: z.string().min(1).max(200) });

// Verifies the admin passcode up front so the sign-in screen can give
// immediate feedback; every write endpoint checks it again per request.
export default withErrors(async (req, res) => {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }
  if (expectedPasscode() === undefined) {
    sendJson(res, 500, {
      error: "ADMIN_PASSCODE is not configured on the server",
    });
    return;
  }
  const body = await parseBody(req, res, bodySchema);
  if (!body) return;
  if (!isValidPasscode(body.passcode)) {
    sendJson(res, 401, { error: "Incorrect passcode" });
    return;
  }
  sendJson(res, 200, { ok: true });
});


