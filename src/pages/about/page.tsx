import StoreContact from "@/components/layout/store-contact";
import { Link } from "react-router-dom";
import CraftVideo from "@/components/craft-video.tsx";
import { Button } from "@/components/ui/button.tsx";
import { IMAGES, unsplash } from "@/data/site.ts";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-16 lg:px-8">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          About HAWK
        </p>
        <h1 className="text-balance font-serif text-6xl font-extrabold uppercase leading-none">
          Engineered with purpose.
        </h1>
        <p className="text-lg text-muted-foreground">
          HAWK is a speaker and professional audio brand spun off from BSSSound.
          We are developing our own range of speakers, subwoofers and audio
          products, alongside equipment rentals and speaker repairs.
        </p>
      </header>
      <img
        src={unsplash(IMAGES.speakerB, 1600)}
        alt=""
        className="aspect-[21/9] w-full object-cover"
      />
      <p className="max-w-3xl text-muted-foreground">
        More about our story, team and manufacturing approach will be added here
        once verified information is provided.
      </p>
      <CraftVideo />
      <StoreContact />
      <Button asChild size="lg">
        <Link to="/shop">Shop the range</Link>
      </Button>
    </div>
  );
}
