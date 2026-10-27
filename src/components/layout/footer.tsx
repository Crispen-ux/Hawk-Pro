import { Link } from "react-router-dom";
import { SOCIAL_LINKS } from "@/data/site.ts";
import { useSiteSettings } from "@/hooks/use-settings.tsx";
import Logo from "./logo.tsx";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "All products", to: "/shop" },
      { label: "Speakers", to: "/shop?category=speakers" },
      { label: "Subwoofers", to: "/shop?category=subwoofers" },
      { label: "Accessories", to: "/shop?category=accessories" },
      { label: "Sound systems", to: "/shop?category=systems" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Rentals", to: "/rentals" },
      { label: "Request a rental quote", to: "/rentals#enquiry" },
      { label: "Repairs and support", to: "/repairs" },
      { label: "Request a repair", to: "/repairs#enquiry" },
    ],
  },
  {
    title: "HAWK",
    links: [
      { label: "About HAWK", to: "/about" },
      { label: "Privacy policy", to: "/legal/privacy" },
      { label: "Terms and conditions", to: "/legal/terms" },
    ],
  },
];

export default function Footer() {
  const { settings } = useSiteSettings();
  const contact = settings.contact;

  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-5 lg:px-8">
        <div className="space-y-4 lg:col-span-2">
          <Logo className="h-16" />
          <p className="max-w-xs text-sm text-muted-foreground">
            Speakers, subwoofers and professional audio. Rentals and repairs.
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>{contact.email}</li>
            <li>{contact.phone}</li>
            <li>{contact.address}</li>
            <li>{contact.hours}</li>
          </ul>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="mb-4 font-serif text-lg uppercase tracking-widest">
              {col.title}
            </h2>
            <ul className="space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-muted-foreground hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row lg:px-8">
          <p>&copy; {new Date().getFullYear()} HAWK. All rights reserved.</p>
          <ul className="flex gap-4" aria-label="Social media (placeholders)">
            {SOCIAL_LINKS.map((s) => (
              <li key={s}>
                <span className="cursor-default">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
