import StoreContact from "@/components/layout/store-contact";
import { Link } from "react-router-dom";
import CraftVideo from "@/components/craft-video";
import { Button } from "@/components/ui/button";
import ContentImage from "@/components/content-image";
const SERVICES = [
  {
    title: "Speakers & sound systems",
    body: "Explore speakers, subwoofers, accessories and complete sound systems. Product pages bring together specifications, pack contents, pricing and availability to help you compare your options.",
    to: "/shop",
    cta: "Explore the range",
  },
  {
    title: "Equipment rentals",
    body: "Need sound for an event or function? Share your date, venue and requirements so we can review your enquiry and prepare a rental quote. Availability is confirmed when we respond.",
    to: "/rentals#enquiry",
    cta: "Request a rental quote",
  },
  {
    title: "Repairs & diagnostics",
    body: "A fault does not always mean replacing your equipment. Tell us about the symptoms so we can assess the speaker and advise on the next steps. Costs and turnaround times follow assessment.",
    to: "/repairs#enquiry",
    cta: "Enquire about a repair",
  },
];
export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:py-16 lg:px-8">
      <header className="max-w-3xl space-y-5">
        <p className="text-sm font-semibold uppercase tracking-[.3em] text-primary">
          About HAWK
        </p>
        <h1 className="text-balance font-serif text-5xl font-extrabold uppercase leading-none sm:text-7xl">
          Engineered with purpose.
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          Speakers, sound systems and practical support for the people who use
          them. HAWK brings a developing professional audio range together with
          equipment rentals and speaker repairs.
        </p>
      </header>
      <ContentImage
        slot="about-main"
        className="aspect-[4/3] w-full sm:aspect-[21/9]"
      />
      <section className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
        <h2 className="font-serif text-4xl font-extrabold uppercase sm:text-5xl">
          Our story.
        </h2>
        <div className="max-w-3xl space-y-4 leading-relaxed text-muted-foreground">
          <p>
            HAWK is a speaker and professional audio brand developed from
            BSSSound. We are building our own range of speakers, subwoofers and
            audio products, alongside rental equipment and repair services.
          </p>
          <p>
            Our focus is practical: helping customers choose equipment for their
            setup, understand what is included and find support when something
            needs attention. Whether you are comparing a single speaker,
            planning a sound system or arranging equipment for an event, the
            starting point is what you need the sound to do.
          </p>
        </div>
      </section>
      <section className="space-y-8">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[.3em] text-primary">
            What we do
          </p>
          <h2 className="font-serif text-4xl font-extrabold uppercase sm:text-5xl">
            From the system to the support.
          </h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <article
              key={s.to}
              className="flex flex-col gap-5 border bg-card p-6"
            >
              <h3 className="font-serif text-2xl font-bold uppercase">
                {s.title}
              </h3>
              <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
              <Link
                className="font-semibold text-primary underline underline-offset-4"
                to={s.to}
              >
                {s.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>
      <CraftVideo />
      <section className="grid gap-8 border-y py-10 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="font-serif text-4xl font-bold uppercase">
            Know your sound.
          </h2>
          <p className="max-w-xl leading-relaxed text-muted-foreground">
            A useful specification is one you can understand. Our product
            information, audio guides and calculators help you ask the right
            questions about power, speaker matching and setup.
          </p>
          <p className="max-w-xl leading-relaxed text-muted-foreground">
            For rental and repair enquiries, we review your requirements before
            confirming availability, costs or timing.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-4">
          <Link
            className="rounded border p-5 font-semibold hover:border-primary"
            to="/resources"
          >
            Read the audio guides →
          </Link>
          <Link
            className="rounded border p-5 font-semibold hover:border-primary"
            to="/tools"
          >
            Explore the free audio tools →
          </Link>
        </div>
      </section>
      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="font-serif text-4xl font-bold uppercase">
            Let’s talk about your setup.
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Tell us what you are working towards. Contact the team about product
            information, a rental enquiry or a speaker that needs attention.
          </p>
          <Button asChild size="lg">
            <Link to="/shop">Shop the range</Link>
          </Button>
        </div>
        <StoreContact />
      </section>
    </div>
  );
}
