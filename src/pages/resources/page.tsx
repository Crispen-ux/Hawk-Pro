import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";
import { ARTICLES } from "@/data/resources.ts";
import { useSeo } from "@/hooks/use-seo.ts";
import CtaPanel from "./_components/cta-panel.tsx";

export default function ResourcesPage() {
  useSeo({
    title: "Audio guides and resources | HAWK Audio",
    description:
      "Practical guides on choosing PA speakers, renting sound equipment, speaker faults and subwoofer setup, plus free audio calculators.",
  });
  const articles = [...ARTICLES].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-12 lg:px-8 lg:py-16">
      <header className="space-y-3">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.4em] text-primary">
          <span className="h-px w-8 bg-primary" /> Resources
        </p>
        <h1 className="text-balance font-serif text-5xl font-extrabold uppercase leading-[0.92] sm:text-7xl">
          Know your sound.
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Straight-talking guides on speakers, rentals, repairs and setup. Try
          our{" "}
          <Link to="/tools" className="underline hover:text-primary">
            free audio calculators
          </Link>{" "}
          too.
        </p>
      </header>

      <ul className="divide-y border-y">
        {articles.map((a) => (
          <li key={a.slug}>
            <Link
              to={`/resources/${a.slug}`}
              className="group flex items-start justify-between gap-6 py-6"
            >
              <span className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                  {a.category} / {a.readMinutes} min read
                </span>
                <span className="block font-serif text-3xl font-bold uppercase leading-none group-hover:text-primary sm:text-4xl">
                  {a.title}
                </span>
                <span className="block max-w-2xl text-sm text-muted-foreground">
                  {a.description}
                </span>
              </span>
              <ArrowRightIcon className="mt-2 size-6 shrink-0 transition-transform group-hover:translate-x-2" />
            </Link>
          </li>
        ))}
      </ul>

      <CtaPanel target="rentals" />
    </div>
  );
}
