import { useEffect } from "react";

type Seo = {
  title: string;
  description: string;
  jsonLd?: Record<string, unknown>;
};

function setMeta(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

// Per-page title, description and optional structured data for search engines.
export function useSeo({ title, description, jsonLd }: Seo) {
  const ld = jsonLd ? JSON.stringify(jsonLd) : "";
  useEffect(() => {
    document.title = title;
    setMeta("description", description);
    if (!ld) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = ld;
    document.head.appendChild(script);
    return () => script.remove();
  }, [title, description, ld]);
}
