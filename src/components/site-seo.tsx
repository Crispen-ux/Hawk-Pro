import { useLocation } from "react-router-dom";
import { useSeo } from "@/hooks/use-seo";
import { useCatalogue } from "@/hooks/use-catalogue";
import { SEO_PAGES, siteOrigin } from "../../db/seo";
import { getArticle } from "@/data/resources";
export default function SiteSeo() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, "") || "/";
  const { products, loading } = useCatalogue();
  const base =
    siteOrigin(import.meta.env.VITE_SITE_URL) || window.location.origin;
  let seo: { title: string; description: string } = SEO_PAGES[
    path as keyof typeof SEO_PAGES
  ] ?? {
    title: "Page not found | HAWK Audio",
    description:
      "Explore HAWK speakers, sound equipment rentals and speaker repairs.",
  };
  let noindex = !(path in SEO_PAGES);
  let image = base + "/brand/hawk-red.png";
  let type = "website";
  let jsonLd: Record<string, unknown> | undefined;
  if (path === "/") {
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "HAWK Audio",
      url: base,
      logo: base + "/brand/hawk-red.png",
    };
  }
  if (path.startsWith("/resources/")) {
    const article = getArticle(path.slice(11));
    if (article) {
      seo = {
        title: article.title + " | HAWK Audio",
        description: article.description,
      };
      type = "article";
      noindex = false;
      jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.description,
        datePublished: article.publishedAt,
        mainEntityOfPage: base + path,
        author: { "@type": "Organization", name: "HAWK Audio" },
      };
    }
  }
  if (path.startsWith("/shop/")) {
    let slug = path.slice(6);
    try {
      slug = decodeURIComponent(slug);
    } catch {
      /* malformed URL remains unmatched */
    }
    const product = products.find((p) => p.slug === slug);
    if (product) {
      seo = {
        title: product.name + " | HAWK Audio",
        description: product.shortDescription.slice(0, 300),
      };
      noindex = false;
      if (product.images[0]) {
        try {
          const url = new URL(product.images[0], base);
          if (url.protocol === "https:") image = url.href;
        } catch {
          /* keep the brand image */
        }
      }
    } else if (loading) {
      seo = {
        title: "Product details | HAWK Audio",
        description: SEO_PAGES["/shop"].description,
      };
      noindex = false;
    }
  }
  const privatePage =
    /^\/(admin|account|checkout|orders|auth)(\/|$)/.test(path) ||
    ["/login", "/signup", "/forgot-password", "/reset-password"].includes(path);
  if (privatePage) {
    seo = {
      title: "Account & administration | HAWK Audio",
      description: "Secure access to your HAWK Audio account.",
    };
    noindex = true;
    jsonLd = undefined;
  }
  useSeo({
    ...seo,
    image,
    type,
    noindex: noindex || import.meta.env.VITE_SEO_PREVIEW === "true",
    canonical: noindex ? undefined : base + path,
    jsonLd,
  });
  return null;
}
