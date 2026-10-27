import { and, eq, gt, sql } from "drizzle-orm";
import {
  randomBytes,
  randomInt,
  scryptSync,
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";
import { getDb } from "../db/index.ts";
import { accounts, challenges, commerce } from "../db/schema.ts";
import { parseBody, sendJson, withErrors } from "./_lib/http.ts";
import { readSession, signSession } from "./_lib/session.ts";
import { allowAuth } from "./_lib/rate-limit.ts";
import { sendEmail } from "./_lib/email.ts";
const digest = (s: string) => {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  return createHmac("sha256", secret).update(s).digest("hex");
};
const hashPassword = (s: string) => {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(s, salt, 64).toString("hex");
};
const password = z.string().min(12).max(128);
export default withErrors(async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "POST") {
    const origin = req.headers.origin;
    if (origin && new URL(origin).host !== req.headers.host) {
      sendJson(res, 403, { error: "Cross-origin request rejected" });
      return;
    }
  }
  const db = getDb();
  if (req.method === "GET") {
    const session = readSession(req);
    if (!session) {
      sendJson(res, 401, { error: "Sign in required" });
      return;
    }
    const [a] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, session.id));
    if (!a || !a.verified || a.sessionVersion !== session.version) {
      sendJson(res, 401, { error: "Sign in required" });
      return;
    }
    const orders = await db
      .select()
      .from(commerce)
      .where(
        and(
          eq(commerce.kind, "orders"),
          sql`${commerce.data}->>'email'=${a.email}`,
        ),
      );
    sendJson(res, 200, {
      user: { name: a.name, email: a.email, role: a.role },
      orders,
    });
    return;
  }
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }
  const body = await parseBody(
    req,
    res,
    z.object({
      action: z.enum([
        "register",
        "login",
        "request",
        "verify",
        "reset",
        "logout",
      ]),
      email: z
        .email()
        .transform((s) => s.toLowerCase())
        .optional(),
      name: z.string().min(2).max(160).optional(),
      password: password.optional(),
      code: z
        .string()
        .regex(/^\d{6}$/)
        .optional(),
      purpose: z.enum(["verify", "login", "reset"]).optional(),
    }),
  );
  if (!body) return;
  if (body.action === "logout") {
    res.setHeader(
      "Set-Cookie",
      `hawk_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
    );
    sendJson(res, 200, { ok: true });
    return;
  }
  if (!body.email) {
    sendJson(res, 400, { error: "Email required" });
    return;
  }
  const email = body.email;
  if (!(await allowAuth(`account:${email}`, 30, 15 * 60000))) {
    sendJson(res, 429, {
      error: "Too many attempts. Try again in 15 minutes.",
    });
    return;
  }
  if (
    body.action === "login" &&
    !(await allowAuth(`password:${email}`, 5, 15 * 60000))
  ) {
    sendJson(res, 429, {
      error: "Too many sign-in attempts. Try again in 15 minutes.",
    });
    return;
  }
  let [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.email, email));
  if (body.action === "register" && account?.verified) {
    sendJson(res, 200, {
      ok: true,
      message: "If this account is eligible, a code has been emailed.",
    });
    return;
  }
  if (body.action === "register") {
    if (!body.password || !body.name) {
      sendJson(res, 400, { error: "Name and password required" });
      return;
    }
    if (!account) {
      [account] = await db
        .insert(accounts)
        .values({
          email,
          name: body.name,
          passwordHash: hashPassword(body.password),
          role: "customer",
        })
        .onConflictDoNothing()
        .returning();
    }
  }
  if (body.action === "login") {
    const salt = account?.passwordHash.split(":")[0] ?? "dummy";
    const hash = scryptSync(body.password ?? "", salt, 64);
    const expected = Buffer.from(
      account?.passwordHash.split(":")[1] ?? "00".repeat(64),
      "hex",
    );
    if (
      !account ||
      expected.length !== hash.length ||
      !timingSafeEqual(hash, expected)
    ) {
      sendJson(res, 401, { error: "Email or password is incorrect" });
      return;
    }
  }
  const purpose =
    body.action === "register"
      ? "verify"
      : body.action === "login"
        ? "login"
        : (body.purpose ?? "reset");
  if (["request", "login", "register"].includes(body.action)) {
    if (body.action === "request" && purpose !== "reset") {
      sendJson(res, 400, {
        error: "Sign in with your password to request a login code",
      });
      return;
    }
    if (account) {
      const code = String(randomInt(100000, 1000000));
      const now = new Date();
      const inserted = await db
        .insert(challenges)
        .values({
          email,
          purpose,
          hash: digest(code),
          expiresAt: new Date(Date.now() + 10 * 60000),
        })
        .onConflictDoUpdate({
          target: [challenges.email, challenges.purpose],
          set: {
            hash: digest(code),
            expiresAt: new Date(Date.now() + 10 * 60000),
            createdAt: now,
            attempts: 0,
          },
          setWhere: sql`${challenges.createdAt} < ${new Date(Date.now() - 60000)}`,
        })
        .returning();
      if (!inserted.length) {
        sendJson(res, 429, {
          error: "Please wait one minute before requesting another code",
        });
        return;
      }
      await sendEmail(
        email,
        "Your Hawk verification code",
        `Your code is ${code}.\nIt expires in 10 minutes. Never share this code.\nIf you did not request this, ignore this email.`,
      );
    }
    sendJson(res, 200, {
      ok: true,
      message: "If this account is eligible, a code has been emailed.",
    });
    return;
  }
  if (!body.code) {
    sendJson(res, 400, { error: "Enter the six-digit code" });
    return;
  }
  if (body.action === "verify" && purpose === "reset") {
    sendJson(res, 400, { error: "Use the password reset form" });
    return;
  }
  if (body.action === "reset" && (purpose !== "reset" || !body.password)) {
    sendJson(res, 400, { error: "New password and reset code required" });
    return;
  }
  const [challenge] = await db
    .update(challenges)
    .set({ attempts: sql`${challenges.attempts}+1` })
    .where(
      and(
        eq(challenges.email, email),
        eq(challenges.purpose, purpose),
        gt(challenges.expiresAt, new Date()),
        sql`${challenges.attempts}<5`,
      ),
    )
    .returning();
  if (!account || !challenge || challenge.hash !== digest(body.code)) {
    sendJson(res, 400, { error: "Invalid or expired code" });
    return;
  }
  const consumed = await db
    .delete(challenges)
    .where(eq(challenges.id, challenge.id))
    .returning();
  if (!consumed.length) {
    sendJson(res, 400, { error: "Code already used" });
    return;
  }
  if (body.action === "reset") {
    await db
      .update(accounts)
      .set({
        passwordHash: hashPassword(body.password!),
        sessionVersion: sql`${accounts.sessionVersion}+1`,
      })
      .where(eq(accounts.id, account.id));
    sendJson(res, 200, { ok: true });
    return;
  }
  await db
    .update(accounts)
    .set({ verified: true })
    .where(eq(accounts.id, account.id));
  if (!account.verified) {
    await db.insert(commerce).values({
      kind: "customers",
      data: {
        name: account.name,
        email,
        phone: "",
        notes: "Registered customer account",
        consent: false,
      },
    });
    try {
      await sendEmail(
        email,
        "Welcome to Hawk",
        `Hi ${account.name},\nWelcome to Hawk Pro Audio. Your account is verified and ready. Explore our catalogue for your next sound system.`,
      );
    } catch {
      console.error("Welcome email delivery failed");
    }
  }
  res.setHeader(
    "Set-Cookie",
    `hawk_session=${signSession({ id: account.id, role: account.role, version: account.sessionVersion, exp: Date.now() + 8 * 3600000 })}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
  sendJson(res, 200, { ok: true, role: account.role });
});
