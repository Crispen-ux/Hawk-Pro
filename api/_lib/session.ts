import { createHmac, timingSafeEqual } from "node:crypto";
import type { ApiRequest } from "./http.ts";
export function signSession(payload: Record<string, unknown>) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("Set SESSION_SECRET to at least 32 random characters");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return (
    body + "." + createHmac("sha256", secret).update(body).digest("base64url")
  );
}
export function readSession(
  req: ApiRequest,
): { id: string; role: string; version: number } | null {
  try {
    const token = (req.headers.cookie ?? "")
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("hawk_session="))
      ?.slice(13);
    if (!token) return null;
    const [body, sig] = token.split(".");
    const expected = signSession(
      JSON.parse(Buffer.from(body, "base64url").toString()),
    ).split(".")[1];
    const a = Buffer.from(sig ?? "");
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    if (p.exp < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
}
