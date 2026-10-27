import { describe, expect, it } from "vitest";
import type { ApiRequest, ApiResponse } from "../../api/_lib/http";
import account from "../../api/account";
import commerce from "../../api/commerce";
import products from "../../api/products";
import enquiries from "../../api/enquiries";
import settings from "../../api/settings";
import upload from "../../api/upload";

describe("server-side administrator protection", () => {
  it.each([
    ["session", account, "GET", {}],
    ["commerce", commerce, "GET", {}],
    ["unpublished catalogue", products, "GET", { all: "1" }],
    ["create product", products, "POST", {}],
    ["enquiries", enquiries, "GET", {}],
    ["settings writes", settings, "PUT", {}],
    ["image uploads", upload, "POST", {}],
  ] as const)(
    "rejects anonymous access to %s before touching the database",
    async (_name, handler, method, query) => {
      let payload = "";
      const res = {
        statusCode: 200,
        setHeader() {},
        end(body: string) {
          payload = body;
        },
        writableEnded: false,
      } as unknown as ApiResponse;
      const req = { method, headers: {}, query } as unknown as ApiRequest;
      await handler(req, res);
      expect(res.statusCode).toBe(401);
      expect(JSON.parse(payload)).toHaveProperty("error");
    },
  );
});
