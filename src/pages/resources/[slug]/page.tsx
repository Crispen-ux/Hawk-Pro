import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button.tsx";
import { getArticle } from "@/data/resources.ts";
import { useSeo } from "@/hooks/use-seo.ts";
import CtaPanel from "../_components/cta-panel.tsx";

export default function ArticlePage() {
  const { slug = "" } = useParams();
  const article = getArticle(slug);

  useSeo({
    title: article
      ? `${article.title} | HAWK Audio`
      : "Article not found | HAWK Audio",
    description: article?.description ?? "This article could not be found.",
    jsonLd: article
      ? {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.description,
          datePublished: article.publishedAt,
          author: { "@type": "Organization", name: "HAWK" },
        }
      : undefined,
  });

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-24 text-center">
        <h1 className="font-serif text-4xl font-bold uppercase">
          Article not found
        </h1>
        <Button asChild>
          <Link to="/resources">Back to resources</Link>
        </Button>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl space-y-8 px-4 py-12 lg:py-16">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link to="/resources" className="hover:text-primary">
          Resources
        </Link>{" "}
        / {article.category}
      </nav>
      <header className="space-y-3">
        <h1 className="text-balance font-serif text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl">
          {article.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(article.publishedAt), "d MMMM yyyy")} /{" "}
          {article.readMinutes} min read
        </p>
      </header>
      <div className="space-y-4 leading-relaxed">
        {article.body.map((b, i) => {
          if (b.type === "h2")
            return (
              <h2
                key={i}
                className="pt-4 font-serif text-3xl font-bold uppercase"
              >
                {b.text}
              </h2>
            );
          if (b.type === "ul")
            return (
              <ul
                key={i}
                className="list-disc space-y-1.5 pl-6 text-muted-foreground"
              >
                {b.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            );
          return (
            <p key={i} className="text-muted-foreground">
              {b.text}
            </p>
          );
        })}
      </div>
      <CtaPanel target={article.cta} />
    </article>
  );
}
