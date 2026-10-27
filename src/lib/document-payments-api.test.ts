import { beforeEach, expect, it, vi } from "vitest";
import type { ApiRequest, ApiResponse } from "../../api/_lib/http";
const state = vi.hoisted(() => ({ admin: false }));
vi.mock("../../api/_lib/http", async (original) => ({
  ...(await original<typeof import("../../api/_lib/http")>()),
  requireAdmin: vi.fn(async (_req, res) => {
    if (state.admin) return true;
    res.statusCode = 401;
    res.end(JSON.stringify({ error: "Sign in" }));
    return false;
  }),
}));
vi.mock("../../db/document-payments", () => ({
  getDocumentPayments: vi.fn(),
  saveDocumentPayments: vi.fn(),
}));
vi.mock("../../db/settings", () => ({
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
}));
import settings from "../../api/settings";
import {
  getDocumentPayments,
  saveDocumentPayments,
} from "../../db/document-payments";
import { getSettings } from "../../db/settings";
import { DEFAULT_DOCUMENT_PAYMENTS } from "../../db/document-payments-validation";
import { DEFAULT_SETTINGS } from "../../db/validation";
beforeEach(() => {
  vi.clearAllMocks();
  state.admin = false;
});
async function call(method: string, url: string, body?: unknown) {
  let payload = "";
  const res = {
    statusCode: 200,
    writableEnded: false,
    setHeader() {},
    end(value: string) {
      payload = value;
    },
  } as unknown as ApiResponse;
  await settings({ method, url, headers: {}, body } as ApiRequest, res);
  return { status: res.statusCode, body: JSON.parse(payload) };
}
it("protects bank settings reads and writes before database access", async () => {
  for (const method of ["GET", "PUT"])
    expect(
      (await call(method, "/api/settings?section=document-payments", {}))
        .status,
    ).toBe(401);
  expect(getDocumentPayments).not.toHaveBeenCalled();
  expect(saveDocumentPayments).not.toHaveBeenCalled();
});
it("loads and validates payment settings for an administrator", async () => {
  state.admin = true;
  vi.mocked(getDocumentPayments).mockResolvedValue(DEFAULT_DOCUMENT_PAYMENTS);
  expect(
    (await call("GET", "/api/settings?section=document-payments")).body
      .payments,
  ).toEqual(DEFAULT_DOCUMENT_PAYMENTS);
  expect(
    (
      await call("PUT", "/api/settings?section=document-payments", {
        bankEnabled: true,
      })
    ).status,
  ).toBe(400);
  expect(saveDocumentPayments).not.toHaveBeenCalled();
  expect(
    (
      await call("PUT", "/api/settings?section=document-payments", {
        cashEnabled: true,
        cashInstructions: "Cash at collection",
      })
    ).status,
  ).toBe(200);
  expect(saveDocumentPayments).toHaveBeenCalledWith(
    expect.objectContaining({
      cashEnabled: true,
      cashInstructions: "Cash at collection",
    }),
  );
});
it("keeps bank settings out of the public store settings response", async () => {
  vi.mocked(getSettings).mockResolvedValue(DEFAULT_SETTINGS);
  const result = await call("GET", "/api/settings");
  expect(result.status).toBe(200);
  expect(getDocumentPayments).not.toHaveBeenCalled();
  expect(result.body.settings).not.toHaveProperty("accountNumber");
});
