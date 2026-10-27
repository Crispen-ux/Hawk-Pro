import { readSession } from "./session.ts";
import { getDb } from "../../db/index.ts";
import { accounts } from "../../db/schema.ts";
import { eq } from "drizzle-orm";
import { createHash, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { ZodError, ZodType } from "zod";
import { ADMIN_PASSCODE_HEADER } from "../../db/validation.ts";

// Vercel parses JSON bodies onto req.body before the handler runs; the local
// Vite middleware passes the raw stream, so readJson handles both.
export type ApiRequest = IncomingMessage & {
  body?: unknown;
  query?: Record<string, string | string[]>;
};
export type ApiResponse = ServerResponse;
export type Handler = (
  req: ApiRequest,
  res: ApiResponse,
) => void | Promise<void>;

export const PASSCODE_HEADER = ADMIN_PASSCODE_HEADER;

export function sendJson(
  res: ApiResponse,
  status: number,
  payload: unknown,
): void {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Length", Buffer.byteLength(body));
  res.end(body);
}

export async function readJson<T = unknown>(req: ApiRequest): Promise<T> {
  if (req.body !== undefined) return req.body as T;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {} as T;
  return JSON.parse(raw) as T;
}

// Hash-then-compare keeps the check constant time without leaking lengths.
function equalsSecret(candidate: string, expected: string): boolean {
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function expectedPasscode(): string | undefined {
  const value = process.env.ADMIN_PASSCODE?.trim();
  return value ? value : undefined;
}

export function readPasscode(req: ApiRequest): string {
  const header = req.headers[PASSCODE_HEADER];
  const value = Array.isArray(header) ? header[0] : header;
  return value ?? "";
}

export function isValidPasscode(candidate: string): boolean {
  const expected = expectedPasscode();
  if (!expected) return false;
  if (!candidate) return false;
  return equalsSecret(candidate, expected);
}

// Returns false and writes the response when the caller is not signed in.
export async function requireAdmin(
  req: ApiRequest,
  res: ApiResponse,
): Promise<boolean> {
  const session = readSession(req);
  if (session) {
    const [account] = await getDb()
      .select()
      .from(accounts)
      .where(eq(accounts.id, session.id));
    if (account?.role === "admin" && account.sessionVersion === session.version)
      return true;
  }
  sendJson(res, 401, { error: "Administrator sign-in required" });
  return false;
}

export function firstIssue(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid request";
  const path = issue.path.map(String).join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}

// Parses with a schema and answers 400 itself, so handlers stay short.
export async function parseBody<T>(
  req: ApiRequest,
  res: ApiResponse,
  schema: ZodType<T>,
): Promise<T | undefined> {
  let input: unknown;
  try {
    input = await readJson(req);
  } catch (error) {
    sendJson(res, 400, {
      error:
        error instanceof SyntaxError
          ? "Body is not valid JSON"
          : "Invalid request",
    });
    return undefined;
  }
  const result = schema.safeParse(input);
  if (!result.success) {
    sendJson(res, 400, { error: firstIssue(result.error) });
    return undefined;
  }
  return result.data;
}

// Wraps a handler so unexpected failures answer 500 instead of crashing the
// function with an unhandled rejection.
export function withErrors(handler: Handler): Handler {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "";
      const missingDb = detail.startsWith("Missing database connection");
      if (!missingDb) console.error(error);
      if (!res.writableEnded) {
        sendJson(res, missingDb ? 503 : 500, {
          error: missingDb ? detail : "Server error",
        });
      }
    }
  };
}
