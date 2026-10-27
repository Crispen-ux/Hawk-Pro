import { z } from "zod";
import {
  DuplicateSlugError,
  deleteProduct,
  getProduct,
  updateProduct,
} from "../../db/products.ts";
import { productInputSchema } from "../../db/validation.ts";
import { parseBody, requireAdmin, sendJson, withErrors } from "../_lib/http.ts";

const idSchema = z.string().uuid();

// PUT    /api/products/:id    replace a product
// DELETE /api/products/:id    remove a product
export default withErrors(async (req, res) => {
  if (!await requireAdmin(req, res)) return;

  const rawId = req.query?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const parsedId = idSchema.safeParse(id ?? "");
  if (!parsedId.success) {
    sendJson(res, 400, { error: "Unknown product id" });
    return;
  }

  if (req.method === "PUT") {
    const body = await parseBody(req, res, productInputSchema);
    if (!body) return;
    try {
      const updated = await updateProduct(parsedId.data, body);
      if (!updated) {
        sendJson(res, 404, { error: "Product not found" });
        return;
      }
      sendJson(res, 200, { product: updated });
    } catch (error) {
      if (error instanceof DuplicateSlugError) {
        sendJson(res, 409, { error: "That slug is already in use" });
        return;
      }
      throw error;
    }
    return;
  }

  if (req.method === "DELETE") {
    const deleted = await deleteProduct(parsedId.data);
    if (!deleted) {
      sendJson(res, 404, { error: "Product not found" });
      return;
    }
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET") {
    const product = await getProduct(parsedId.data);
    if (!product) {
      sendJson(res, 404, { error: "Product not found" });
      return;
    }
    sendJson(res, 200, { product });
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
});

