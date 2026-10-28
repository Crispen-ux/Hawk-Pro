import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import ContentImage, { ContentOverlay } from "@/components/content-image";
import { useWebsiteContent } from "@/hooks/use-website-content";

export default function Hero() {
  const { hero } = useWebsiteContent();
  return (
    <section className="relative isolate overflow-hidden">
      <ContentImage
        slot="home-hero"
        className="absolute inset-0 -z-20 size-full"
        priority
      />
      <ContentOverlay slot="home-hero" />
      <div className="mx-auto flex min-h-[78vh] max-w-7xl items-center px-4 py-20 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-xl space-y-6"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            Speakers / Subwoofers / Pro audio
          </p>
          <h1 className="text-balance font-serif text-6xl font-extrabold uppercase leading-[0.95] sm:text-8xl">
            {hero.title}
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">{hero.body}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to={hero.href}>{hero.button}</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/rentals">Explore Rentals</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
