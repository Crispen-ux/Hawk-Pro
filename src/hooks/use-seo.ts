import { useEffect } from "react";
export type Seo = {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  type?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
};
function setMeta(
  attribute: "name" | "property",
  name: string,
  content: string,
) {
  let el = document.head.querySelector<HTMLMetaElement>(
    "meta[" + attribute + '="' + name + '"]',
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attribute, name);
    document.head.appendChild(el);
  }
  el.content = content;
}
export function useSeo({
  title,
  description,
  canonical,
  image,
  type = "website",
  noindex = false,
  jsonLd,
}: Seo) {
  const ld = jsonLd ? JSON.stringify(jsonLd) : "";
  useEffect(() => {
    document.title = title;
    setMeta("name", "description", description);
    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", type);
    setMeta("property", "og:site_name", "HAWK Audio");
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    let link = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (canonical) {
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = canonical;
      setMeta("property", "og:url", canonical);
    } else {
      link?.remove();
      document.head.querySelector('meta[property="og:url"]')?.remove();
    }
    if (image) {
      setMeta("property", "og:image", image);
      setMeta("name", "twitter:image", image);
    } else {
      document.head.querySelector('meta[property="og:image"]')?.remove();
      document.head.querySelector('meta[name="twitter:image"]')?.remove();
    }
    document.getElementById("hawk-seo-jsonld")?.remove();
    if (ld) {
      const script = document.createElement("script");
      script.id = "hawk-seo-jsonld";
      script.type = "application/ld+json";
      script.textContent = ld;
      document.head.appendChild(script);
    }
    return () => {
      document.getElementById("hawk-seo-jsonld")?.remove();
    };
  }, [title, description, canonical, image, type, noindex, ld]);
}
