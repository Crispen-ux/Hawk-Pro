import { expect, it, vi, beforeEach } from "vitest";
import type { ApiRequest, ApiResponse } from "../../api/_lib/http";
vi.mock("../../db/products", () => ({
  listProducts: vi.fn(),
  createProduct: vi.fn(),
  DuplicateSlugError: class extends Error {},
}));
import handler from "../../api/products";
import { listProducts } from "../../db/products";
beforeEach(() => {
  vi.clearAllMocks();
});
it("always selects published products for the sitemap, even with all=1", async () => {
  vi.stubEnv("SITE_URL", "https://hawk.example");
  vi.mocked(listProducts).mockResolvedValue([]);
  let output = "";
  const res = {
    setHeader: vi.fn(),
    end(s: string) {
      output = s;
    },
    writableEnded: false,
    statusCode: 200,
  } as unknown as ApiResponse;
  try {
    await handler(
      {
        method: "GET",
        url: "/api/products?format=sitemap&all=1",
        query: { format: "sitemap", all: "1" },
        headers: {},
      } as unknown as ApiRequest,
      res,
    );
    expect(listProducts).toHaveBeenCalledWith({ publishedOnly: true });
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/xml; charset=utf-8",
    );
    expect(output).toContain("<urlset");
    expect(output).toContain("https://hawk.example/about");
  } finally {
    vi.unstubAllEnvs();
  }
});
