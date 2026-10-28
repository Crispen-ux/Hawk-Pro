import { beforeEach, it, expect, vi } from "vitest";
import type { ApiRequest, ApiResponse } from "../../api/_lib/http";
const auth = vi.hoisted(() => ({ admin: false }));
vi.mock("../../api/_lib/http", async (original) => ({
  ...(await original<typeof import("../../api/_lib/http")>()),
  requireAdmin: vi.fn(async (_req, res) => {
    if (auth.admin) return true;
    res.statusCode = 401;
    res.end(JSON.stringify({ error: "Sign in" }));
    return false;
  }),
}));
vi.mock("../../db/website-content-store", () => ({
  getContentState: vi.fn(),
  changeContent: vi.fn(),
}));
import handler from "../../api/settings";
import { getContentState, changeContent } from "../../db/website-content-store";
import { DEFAULT_CONTENT } from "../../db/website-content";
const state = {
  draft: {
    ...DEFAULT_CONTENT,
    hero: { ...DEFAULT_CONTENT.hero, title: "PRIVATE DRAFT" },
  },
  published: DEFAULT_CONTENT,
  previous: null,
  revision: 1,
};
beforeEach(() => {
  vi.clearAllMocks();
  auth.admin = false;
  vi.mocked(getContentState).mockResolvedValue(state);
});
async function call(method: string, admin = false, body?: unknown) {
  let payload = "";
  const res = {
    statusCode: 200,
    setHeader() {},
    end(s: string) {
      payload = s;
    },
    writableEnded: false,
  } as unknown as ApiResponse;
  await handler(
    {
      method,
      url: "/api/settings?section=website-content" + (admin ? "&admin=1" : ""),
      headers: {},
      body,
    } as ApiRequest,
    res,
  );
  return { status: res.statusCode, body: JSON.parse(payload) };
}
it("exposes published content only", async () => {
  const r = await call("GET");
  expect(r.body).toEqual({ content: DEFAULT_CONTENT });
  expect(JSON.stringify(r.body)).not.toContain("PRIVATE DRAFT");
});
it("protects drafts and every write", async () => {
  expect((await call("GET", true)).status).toBe(401);
  expect((await call("PUT", false, {})).status).toBe(401);
  expect(getContentState).not.toHaveBeenCalled();
  expect(changeContent).not.toHaveBeenCalled();
});
it("rejects invalid content and reports concurrent edits", async () => {
  auth.admin = true;
  expect(
    (await call("PUT", true, { action: "publish", revision: 1, content: {} }))
      .status,
  ).toBe(400);
  expect(changeContent).not.toHaveBeenCalled();
  vi.mocked(changeContent).mockResolvedValue(null);
  expect(
    (
      await call("PUT", true, {
        action: "publish",
        revision: 1,
        content: DEFAULT_CONTENT,
      })
    ).status,
  ).toBe(409);
});
it("saves drafts through the protected versioned action", async () => {
  auth.admin = true;
  vi.mocked(changeContent).mockResolvedValue(state);
  expect(
    (
      await call("PUT", true, {
        action: "save",
        revision: 1,
        content: DEFAULT_CONTENT,
      })
    ).status,
  ).toBe(200);
  expect(changeContent).toHaveBeenCalledWith("save", DEFAULT_CONTENT, 1);
});
