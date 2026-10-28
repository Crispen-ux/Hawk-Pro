import type { Plugin } from "vite";
import { publicSeoPages, siteOrigin, escapeXml } from "../db/seo.ts";
export function seoHtml(
  html: string,
  seo: { title: string; description: string },
  origin: string,
  path: string,
  noindex = false,
) {
  let result = html.replace(
    /<title>[\s\S]*?<\/title>/,
    "<title>" + escapeXml(seo.title) + "</title>",
  );
  result = result
    .replace(
      /<meta\b[^>]*\b(?:name|property)=["'](?:description|robots|og:[^"']+|twitter:[^"']+)["'][^>]*>/gi,
      "",
    )
    .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, "");
  const tags = [
    ["name", "description", seo.description],
    ["name", "robots", noindex ? "noindex, nofollow" : "index, follow"],
    ["property", "og:title", seo.title],
    ["property", "og:description", seo.description],
    ["property", "og:type", "website"],
    ["property", "og:site_name", "HAWK Audio"],
    ["name", "twitter:card", "summary_large_image"],
    ["name", "twitter:title", seo.title],
    ["name", "twitter:description", seo.description],
    ["property", "og:image", origin + "/brand/hawk-red.png"],
    ["name", "twitter:image", origin + "/brand/hawk-red.png"],
  ];
  if (origin) tags.push(["property", "og:url", origin + path]);
  return result.replace(
    "</head>",
    tags
      .map(
        ([attr, key, value]) =>
          "<meta " +
          attr +
          '="' +
          key +
          '" content="' +
          escapeXml(value) +
          '"/>',
      )
      .join("\n") +
      (origin && !noindex
        ? '<link rel="canonical" href="' + escapeXml(origin + path) + '"/>'
        : "") +
      "\n</head>",
  );
}
export function seoPlugin(env: Record<string, string>): Plugin {
  const origin = siteOrigin(
    env.VITE_SITE_URL ||
      env.SITE_URL ||
      (env.VERCEL_PROJECT_PRODUCTION_URL
        ? "https://" + env.VERCEL_PROJECT_PRODUCTION_URL
        : ""),
  );
  const preview = env.VERCEL_ENV === "preview";
  return {
    name: "hawk-seo",
    enforce: "post",
    generateBundle(_options, bundle) {
      const entry = bundle["index.html"];
      if (!entry || entry.type !== "asset")
        throw new Error("SEO generation requires index.html");
      const html = String(entry.source);
      for (const page of publicSeoPages()) {
        const content = seoHtml(html, page, origin, page.path, preview);
        if (page.path === "/") entry.source = content;
        else
          this.emitFile({
            type: "asset",
            fileName: "seo" + page.path + ".html",
            source: content,
          });
      }
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: preview
          ? "User-agent: *\nDisallow: /\n"
          : "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /account\nDisallow: /checkout\nDisallow: /orders\nDisallow: /auth\nDisallow: /api/\n" +
            (origin ? "Sitemap: " + origin + "/sitemap.xml\n" : ""),
      });
    },
    config() {
      return {
        define: {
          "import.meta.env.VITE_SEO_PREVIEW": JSON.stringify(String(preview)),
        },
      };
    },
  };
}
