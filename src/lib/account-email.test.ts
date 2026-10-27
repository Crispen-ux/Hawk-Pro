import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { scryptSync } from "node:crypto";
import type { ApiRequest, ApiResponse } from "../../api/_lib/http";
const state = vi.hoisted(() => ({ hash: "", deletes: 0 }));
vi.mock("../../db/index", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: async () => [
          {
            id: "313b85e0-3642-45f8-8385-bf60d442219a",
            email: "admin@hawk.example",
            name: "Admin",
            role: "admin",
            verified: true,
            passwordHash: state.hash,
            sessionVersion: 0,
          },
        ],
      }),
    }),
    insert: () => ({
      values: () => ({
        onConflictDoUpdate: () => ({
          returning: async () => [
            { id: "213b85e0-3642-45f8-8385-bf60d442219a" },
          ],
        }),
      }),
    }),
    delete: () => ({
      where: async () => {
        state.deletes++;
        return [];
      },
    }),
  }),
}));
vi.mock("../../api/_lib/rate-limit", () => ({
  allowAuth: vi.fn().mockResolvedValue(true),
}));
vi.mock("../../api/_lib/email", () => ({ sendEmail: vi.fn() }));
import handler from "../../api/account";
import { sendEmail } from "../../api/_lib/email";
beforeEach(() => {
  state.deletes = 0;
  state.hash =
    "test-salt:" +
    scryptSync("test-password-123456", "test-salt", 64).toString("hex");
  vi.stubEnv(
    "SESSION_SECRET",
    "test-signing-secret-with-at-least-32-characters",
  );
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});
async function login() {
  let body = "";
  const headers: Record<string, unknown> = {};
  const res = {
    statusCode: 200,
    writableEnded: false,
    setHeader(k: string, v: unknown) {
      headers[k] = v;
    },
    end(v: string) {
      body = v;
    },
  } as unknown as ApiResponse;
  await handler(
    {
      method: "POST",
      headers: {},
      body: {
        action: "login",
        email: "admin@hawk.example",
        password: "test-password-123456",
      },
    } as unknown as ApiRequest,
    res,
  );
  return { status: res.statusCode, body: JSON.parse(body), headers };
}
it("returns a readable delivery error, removes the undelivered challenge and never signs in", async () => {
  vi.mocked(sendEmail).mockRejectedValue(
    new Error("Email delivery is not configured"),
  );
  const result = await login();
  expect(result.status).toBe(503);
  expect(result.body.error).toContain("could not send your verification code");
  expect(state.deletes).toBe(1);
  expect(result.headers["Set-Cookie"]).toBeUndefined();
});
it("requires the emailed code after a valid password rather than setting a session early", async () => {
  vi.mocked(sendEmail).mockResolvedValue(undefined);
  const result = await login();
  expect(result.status).toBe(200);
  expect(result.body.ok).toBe(true);
  expect(result.headers["Set-Cookie"]).toBeUndefined();
  expect(state.deletes).toBe(0);
});
