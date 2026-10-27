import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { IMAGES, unsplash } from "@/data/site.ts";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <img
        src={unsplash(IMAGES.hero, 2000)}
        alt="Black professional PA speakers"
        className="absolute inset-0 -z-20 size-full object-cover"
        fetchPriority="high"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/70 to-transparent" />
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
            Built to move sound.
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            Discover powerful audio equipment engineered for performance,
            reliability and unforgettable sound.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/shop?category=speakers">Shop Speakers</Link>
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
