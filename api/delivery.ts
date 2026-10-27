import { estimateInputSchema } from "../db/sales-validation";
import { parseBody, sendJson, withErrors } from "./_lib/http";
import { checkoutRateLimit, quoteFor } from "./_lib/checkout-common";
export default withErrors(async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }
  if (!(await checkoutRateLimit(req, res, 100))) return;
  const input = await parseBody(req, res, estimateInputSchema);
  if (!input) return;
  try {
    const { quote } = await quoteFor(input);
    sendJson(res, 200, { quote });
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("A cart item")) {
      sendJson(res, 409, { error: e.message });
      return;
    }
    throw e;
  }
});
