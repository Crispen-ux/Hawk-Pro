import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowRightIcon,
  ShieldCheckIcon,
  LifeBuoyIcon,
  ZapIcon,
  MessagesSquareIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import ProductCard from "@/components/shop/product-card.tsx";
import { CATEGORIES } from "@/data/products.ts";
import { useCatalogue } from "@/hooks/use-catalogue.tsx";
import { IMAGES, unsplash } from "@/data/site.ts";

export function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow?: string;
  title: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="space-y-3"
    >
      {eyebrow && (
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.4em] text-primary">
          <span className="h-px w-8 bg-primary" />
          {eyebrow}
        </p>
      )}
      <h2 className="text-balance font-serif text-5xl font-extrabold uppercase leading-[0.92] tracking-tight sm:text-7xl">
        {title}
      </h2>
    </motion.div>
  );
}

const MARQUEE_WORDS = [
  "Speakers",
  "Subwoofers",
  "Rentals",
  "Repairs",
  "Pro audio",
];

// Endless horizontal ticker; the list is doubled so the loop is seamless.
export function MarqueeBand() {
  const words = [...MARQUEE_WORDS, ...MARQUEE_WORDS];
  return (
    <div
      className="overflow-hidden border-y bg-foreground py-6 text-background"
      aria-hidden="true"
    >
      <motion.div
        className="flex w-max gap-10"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, ease: "linear", repeat: Infinity }}
      >
        {[...words, ...words].map((w, i) => (
          <span
            key={i}
            className="flex items-center gap-10 font-serif text-5xl font-extrabold uppercase tracking-tight sm:text-7xl"
          >
            {w}
            <span className="size-3 bg-primary" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export function CategoriesSection() {
  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-28 lg:px-8">
      <SectionHeading eyebrow="Browse" title="Shop by category" />
      <div className="grid gap-3 md:grid-cols-3 md:grid-rows-3">
        {CATEGORIES.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: "easeOut" }}
            className={i === 0 ? "md:col-span-2 md:row-span-3" : ""}
          >
            <Link
              to={`/shop?category=${c.id}`}
              className={`group relative block overflow-hidden ${i === 0 ? "aspect-[4/5] md:aspect-auto md:h-full md:min-h-[640px]" : "aspect-[4/3]"}`}
            >
              <img
                src={c.image}
                alt=""
                loading="lazy"
                className="absolute inset-0 size-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <span className="absolute left-6 top-6 text-xs font-semibold tracking-[0.3em] text-white/80">
                0{i + 1}
              </span>
              <div className="absolute inset-x-0 bottom-0 space-y-2 p-6 text-white">
                <h3
                  className={`font-serif font-extrabold uppercase leading-none ${i === 0 ? "text-5xl sm:text-7xl" : "text-3xl"}`}
                >
                  {c.name}
                </h3>
                <p className="max-w-sm text-sm text-white/75">
                  {c.description}
                </p>
                <span className="inline-flex items-center gap-2 pt-1 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                  Shop now{" "}
                  <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-2" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function FeaturedProducts() {
  const { products, loading, error } = useCatalogue();
  const featured = products.slice(0, 4);

  return (
    <section className="border-y bg-card/40">
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-28 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="Featured" title="Featured products" />
          <Button asChild variant="secondary">
            <Link to="/shop">View all</Link>
          </Button>
        </div>
        {error && (
          <Alert role="status">
            <AlertTitle>Products could not be loaded</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {loading && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 lg:grid-cols-4 lg:gap-x-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        )}
        {!loading && !error && featured.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No products are published yet. Add the first one in the admin
            portal.
          </p>
        )}
        {!loading && featured.length > 0 && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 lg:grid-cols-4 lg:gap-x-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function StorySection() {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 lg:grid-cols-2 lg:px-8">
      <img
        src={unsplash(IMAGES.mesh, 1000)}
        alt="Close-up of a speaker grille"
        loading="lazy"
        className="aspect-[4/3] w-full object-cover"
      />
      <div className="space-y-5">
        <SectionHeading eyebrow="The brand" title="Engineered with purpose." />
        <p className="text-muted-foreground">
          HAWK is building its own range of speakers, subwoofers and audio
          products, with a focus on dependable equipment that holds up in real
          use.
        </p>
        <p className="text-muted-foreground">
          Born out of BSSSound, HAWK brings sound experience together with a
          product line designed in-house.
        </p>
        <Button asChild size="lg">
          <Link to="/about">Discover HAWK</Link>
        </Button>
      </div>
    </section>
  );
}

export function ServicePanel({
  id,
  image,
  eyebrow,
  title,
  body,
  cta,
  to,
  flip,
}: {
  id: string;
  image: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  to: string;
  flip?: boolean;
}) {
  return (
    <section id={id} className="border-t">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 lg:grid-cols-2 lg:px-8">
        <div className={`space-y-5 ${flip ? "lg:order-2" : ""}`}>
          <SectionHeading eyebrow={eyebrow} title={title} />
          <p className="text-muted-foreground">{body}</p>
          <Button asChild size="lg">
            <Link to={to}>{cta}</Link>
          </Button>
        </div>
        <img
          src={image}
          alt=""
          loading="lazy"
          className="aspect-[4/3] w-full object-cover"
        />
      </div>
    </section>
  );
}

const TRUST = [
  {
    icon: ZapIcon,
    title: "Performance",
    text: "Equipment designed to deliver clean, powerful sound.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Durability",
    text: "Built with dependable, long-term use in mind.",
  },
  {
    icon: LifeBuoyIcon,
    title: "Practical support",
    text: "Rentals and repairs from people who know audio.",
  },
  {
    icon: MessagesSquareIcon,
    title: "Customer service",
    text: "Straight answers and a real person to talk to.",
  },
];

export function TrustSection() {
  return (
    <section className="border-t bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {TRUST.map(({ icon: Icon, title, text }) => (
          <div key={title} className="space-y-2">
            <Icon className="size-7 text-primary" />
            <h3 className="font-serif text-xl font-semibold uppercase tracking-wide">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
