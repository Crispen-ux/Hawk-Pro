import { put } from "@vercel/blob";
import { requireAdmin, sendJson, withErrors } from "./_lib/http.ts";
export default withErrors(async (req, res) => {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }
  if (!(await requireAdmin(req, res))) return;
  const mime = String(req.headers["content-type"] ?? "").split(";")[0];
  if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) {
    sendJson(res, 400, { error: "Use a JPEG, PNG or WebP image" });
    return;
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const b = Buffer.from(chunk);
    size += b.length;
    if (size > 4 * 1024 * 1024) {
      sendJson(res, 413, { error: "Maximum image size is 4 MB" });
      return;
    }
    chunks.push(b);
  }
  const bytes = Buffer.concat(chunks);
  const valid =
    mime === "image/jpeg"
      ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : mime === "image/png"
        ? bytes
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : bytes.toString("ascii", 0, 4) === "RIFF" &&
          bytes.toString("ascii", 8, 12) === "WEBP";
  if (!valid) {
    sendJson(res, 400, { error: "File contents do not match the image type" });
    return;
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    sendJson(res, 503, { error: "Vercel Blob is not configured" });
    return;
  }
  const blob = await put(`products/image.${mime.split("/")[1]}`, bytes, {
    access: "public",
    contentType: mime,
    addRandomSuffix: true,
  });
  sendJson(res, 200, { url: blob.url });
});
export const config = { api: { bodyParser: false } };
