import { ARTICLES } from "./resources.ts";
export const SEO_PAGES = {
  "/": {
    title: "HAWK Audio | Speakers, Subwoofers, Rentals & Repairs",
    description:
      "Explore HAWK speakers, subwoofers and complete sound systems. Enquire about professional audio rentals, speaker diagnostics and repairs.",
  },
  "/shop": {
    title: "Speakers, Subwoofers & Sound Systems | HAWK Audio",
    description:
      "Browse HAWK speakers, subwoofers, audio accessories and complete sound systems. Compare product specifications, availability and prices.",
  },
  "/rentals": {
    title: "Audio Equipment & Speaker Rentals | HAWK Audio",
    description:
      "Request a quote for speakers, subwoofers and audio equipment for your event. Tell HAWK about your date, venue and sound requirements.",
  },
  "/repairs": {
    title: "Speaker Repairs & Diagnostics | HAWK Audio",
    description:
      "Enquire about speaker diagnostics, repairs and servicing. Describe the fault and HAWK will assess the equipment and confirm the next steps.",
  },
  "/about": {
    title: "About HAWK | Professional Audio, Rentals & Repairs",
    description:
      "Discover HAWK, a professional audio brand developed from BSSSound, with a growing range of speakers, subwoofers, equipment rentals and speaker repairs.",
  },
  "/tools": {
    title: "Free Audio Calculators & Sound Tools | HAWK Audio",
    description:
      "Plan your audio setup with free tools for amplifier power, speaker delay, cable loss, room modes and impedance. Check results against equipment specifications.",
  },
  "/resources": {
    title: "Audio Guides & Resources | HAWK Audio",
    description:
      "Practical guides to PA speakers, sound equipment rentals, speaker faults, active and passive systems, and subwoofer placement.",
  },
} as const;
export function publicSeoPages() {
  return [
    ...Object.entries(SEO_PAGES).map(([path, seo]) => ({ path, ...seo })),
    ...ARTICLES.map((a) => ({
      path: "/resources/" + a.slug,
      title: a.title + " | HAWK Audio",
      description: a.description,
    })),
  ];
}
export function siteOrigin(value?: string) {
  try {
    const url = new URL(value ?? "");
    if (url.protocol !== "https:" || url.username || url.password) return "";
    return url.origin;
  } catch {
    return "";
  }
}
export function escapeXml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
}
export function sitemapXml(
  origin: string,
  products: { slug: string; updatedAt: string | Date }[],
) {
  const pages = publicSeoPages().map((p) => ({
    path: p.path,
    updatedAt: undefined as string | undefined,
  }));
  const urls = [
    ...pages,
    ...products.map((p) => ({
      path: "/shop/" + encodeURIComponent(p.slug),
      updatedAt: new Date(p.updatedAt).toISOString(),
    })),
  ];
  return (
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    urls
      .map(
        (p) =>
          "<url><loc>" +
          escapeXml(origin + p.path) +
          "</loc>" +
          (p.updatedAt ? "<lastmod>" + p.updatedAt + "</lastmod>" : "") +
          "</url>",
      )
      .join("") +
    "</urlset>"
  );
}
