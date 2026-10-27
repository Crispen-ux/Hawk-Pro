import {
  DuplicateSlugError,
  createProduct,
  listProducts,
} from "../db/products.ts";
import { productInputSchema } from "../db/validation.ts";
import { parseBody, requireAdmin, sendJson, withErrors } from "./_lib/http.ts";

// GET  /api/products          published catalogue for the storefront
// GET  /api/products?all=1    every row, admin only
// POST /api/products          create, admin only
export default withErrors(async (req, res) => {
  if (req.method === "GET") {
    const wantsAll = String(req.query?.all ?? "") === "1";
    if (wantsAll && !await requireAdmin(req, res)) return;
    const rows = await listProducts({ publishedOnly: !wantsAll });
    sendJson(res, 200, { products: rows });
    return;
  }

  if (req.method === "POST") {
    if (!await requireAdmin(req, res)) return;
    const body = await parseBody(req, res, productInputSchema);
    if (!body) return;
    try {
      const created = await createProduct(body);
      sendJson(res, 201, { product: created });
    } catch (error) {
      if (error instanceof DuplicateSlugError) {
        sendJson(res, 409, { error: "That slug is already in use" });
        return;
      }
      throw error;
    }
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
});


