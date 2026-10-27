import StoreContact from "@/components/layout/store-contact";
import RepairForm from "./_components/repair-form.tsx";
import { IMAGES, unsplash } from "@/data/site.ts";

export default function RepairsPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b">
        <img
          src={unsplash(IMAGES.solder, 1800)}
          alt=""
          className="absolute inset-0 -z-20 size-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-background/80" />
        <div className="mx-auto max-w-7xl space-y-4 px-4 py-24 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            Repairs and servicing
          </p>
          <h1 className="max-w-2xl text-balance font-serif text-6xl font-extrabold uppercase leading-none">
            Get your speakers back to work.
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Diagnostics, repairs and maintenance for speakers and audio
            equipment.
          </p>
        </div>
      </section>
      <section
        id="enquiry"
        className="mx-auto grid max-w-7xl gap-12 px-4 py-16 lg:grid-cols-[1fr_1.4fr] lg:px-8"
      >
        <div className="space-y-4">
          <h2 className="font-serif text-4xl font-bold uppercase">
            Request a repair
          </h2>
          <p className="text-muted-foreground">
            Describe the fault and we'll assess it. Turnaround times and costs
            are provided after assessment.
          </p>
          <StoreContact />
        </div>
        <RepairForm />
      </section>
    </>
  );
}
