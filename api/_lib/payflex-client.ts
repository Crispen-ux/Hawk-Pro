import { z } from "zod";
const config = () => {
  const live = process.env.PAYFLEX_ENVIRONMENT === "live";
  if (process.env.VERCEL_ENV === "production" && !live)
    throw new Error("Live Payflex credentials are required in production");
  const clientId = process.env.PAYFLEX_CLIENT_ID,
    clientSecret = process.env.PAYFLEX_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Payflex is not configured");
  return {
    clientId,
    clientSecret,
    api: live ? "https://api.payflex.co.za" : "https://api.uat.payflex.co.za",
    auth: live
      ? "https://auth.payflex.co.za/auth/merchant"
      : "https://auth-uat.payflex.co.za/auth/merchant",
    audience: live
      ? "https://auth-production.payflex.co.za"
      : "https://auth-dev.payflex.co.za",
  };
};
export function payflexReady() {
  if (
    process.env.VERCEL_ENV === "production" &&
    process.env.PAYFLEX_ENVIRONMENT !== "live"
  )
    return false;
  if (
    !process.env.PAYFLEX_CLIENT_ID ||
    !process.env.PAYFLEX_CLIENT_SECRET ||
    !process.env.SESSION_SECRET ||
    process.env.SESSION_SECRET.length < 32
  )
    return false;
  try {
    siteUrl();
    return true;
  } catch {
    return false;
  }
}
export function siteUrl() {
  const url = new URL(process.env.SITE_URL ?? "");
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/"
  )
    throw new Error("Configure SITE_URL as your HTTPS store origin");
  return url.origin;
}
let cached: { token: string; expires: number; auth: string } | null = null;
async function token() {
  const cfg = config();
  if (cached && cached.auth === cfg.auth && cached.expires > Date.now() + 60000)
    return cached.token;
  const r = await fetch(cfg.auth, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      audience: cfg.audience,
      grant_type: "client_credentials",
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error("Payflex authentication failed");
  const value = z
    .object({
      access_token: z.string().min(1),
      expires_in: z.number().positive(),
    })
    .parse(await r.json());
  cached = {
    token: value.access_token,
    expires: Date.now() + value.expires_in * 1000,
    auth: cfg.auth,
  };
  return value.access_token;
}
export function safePayflexRedirect(value: string) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    !url.hostname.endsWith(".payflex.co.za") ||
    url.username ||
    url.password
  )
    throw new Error("Unexpected Payflex checkout URL");
  return url.toString();
}
export class PayflexRejected extends Error {}
export async function createPayflexOrder(body: Record<string, unknown>) {
  let bearer: string;
  try {
    bearer = await token();
  } catch {
    throw new PayflexRejected(
      "Online payment is unavailable. Please contact the store.",
    );
  }
  const r = await fetch(config().api + "/order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + bearer,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) {
    if (r.status >= 400 && r.status < 500)
      throw new PayflexRejected(
        "Payflex could not start this payment. Please contact the store.",
      );
    throw new Error("Payflex order creation could not be confirmed");
  }
  const value = z
    .object({
      orderId: z.uuid(),
      redirectUrl: z.url(),
      expiryDateTime: z.string().optional(),
    })
    .parse(await r.json());
  return { ...value, redirectUrl: safePayflexRedirect(value.redirectUrl) };
}
export const payflexOrderSchema = z.object({
  orderId: z.uuid(),
  orderStatus: z.enum([
    "Created",
    "Initiated",
    "Approved",
    "Declined",
    "Abandoned",
  ]),
  amount: z.number().nonnegative(),
  merchantReference: z.string(),
});
export async function getPayflexOrder(id: string) {
  z.uuid().parse(id);
  const r = await fetch(config().api + "/order/" + id, {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + (await token()),
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error("Payflex status could not be verified");
  return payflexOrderSchema.parse(await r.json());
}
