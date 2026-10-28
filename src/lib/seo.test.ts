import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { seoHtml } from "../../build/seo-plugin";
import { sitemapXml, siteOrigin, publicSeoPages } from "../../db/seo";
it("generates escaped route metadata in the initial HTML", () => {
  const html = seoHtml(
    '<head><title>Old</title><meta name="description" content="Old"/><meta property="og:title" content="Old"/></head>',
    { title: "About & HAWK", description: 'Sound "for" events' },
    "https://hawk.example",
    "/about",
  );
  expect(html).toContain("<title>About &amp; HAWK</title>");
  expect(html).toContain('rel="canonical" href="https://hawk.example/about"');
  expect(html).toContain("Sound &quot;for&quot; events");
  expect(html).not.toContain('content="Old"');
  expect(html.match(/property="og:title"/g)).toHaveLength(1);
});
it("does not invent a domain and marks previews as noindex", () => {
  expect(siteOrigin("javascript:alert(1)")).toBe("");
  expect(siteOrigin("https://user:password@hawk.example")).toBe("");
  expect(siteOrigin("https://hawk.example/path")).toBe("https://hawk.example");
  const html = seoHtml(
    "<head><title>old</title></head>",
    { title: "HAWK", description: "Audio" },
    "",
    "/about",
    true,
  );
  expect(html).toContain("noindex, nofollow");
  expect(html).not.toContain('rel="canonical"');
});
it("includes public pages, articles and supplied products in the sitemap", () => {
  const xml = sitemapXml("https://hawk.example", [
    { slug: "speaker-a", updatedAt: "2026-10-01T08:00:00Z" },
  ]);
  expect(xml).toContain("https://hawk.example/about");
  expect(xml).toContain("https://hawk.example/shop/speaker-a");
  expect(xml).toContain("<lastmod>2026-10-01T08:00:00.000Z</lastmod>");
  expect(xml).not.toContain("/admin");
  expect(xml).not.toContain("/checkout");
  expect(publicSeoPages().length).toBeGreaterThan(7);
});

it("maps every generated public HTML file to a hosting route", () => {
  const config = JSON.parse(
    readFileSync("vercel.json", "utf8"),
  );
  for (const page of publicSeoPages().filter((p) => p.path !== "/")) {
    expect(
      config.routes.some(
        (r: { dest?: string }) => r.dest === "/seo" + page.path + ".html",
      ),
    ).toBe(true);
  }
  expect(
    config.routes.some((r: { handle?: string }) => r.handle === "filesystem"),
  ).toBe(true);
});
