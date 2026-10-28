import StoreContact from "@/components/layout/store-contact";
import RentalAiHelper from "./_components/rental-ai-helper.tsx";
import RentalForm from "./_components/rental-form.tsx";
import ContentImage, { ContentOverlay } from "@/components/content-image";

export default function RentalsPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b">
        <ContentImage
          slot="rentals-hero"
          className="absolute inset-0 -z-20 size-full"
          priority
        />
        <ContentOverlay slot="rentals-hero" />
        <div className="mx-auto max-w-7xl space-y-4 px-4 py-24 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            Rentals
          </p>
          <h1 className="max-w-2xl text-balance font-serif text-6xl font-extrabold uppercase leading-none">
            Audio equipment for your event.
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Speakers, subwoofers and related equipment for events, performances
            and functions.
          </p>
        </div>
      </section>
      <section
        id="enquiry"
        className="mx-auto grid max-w-7xl gap-12 px-4 py-16 lg:grid-cols-[1fr_1.4fr] lg:px-8"
      >
        <div className="space-y-4">
          <h2 className="font-serif text-4xl font-bold uppercase">
            Request a rental quote
          </h2>
          <p className="text-muted-foreground">
            Tell us about your event. We'll review your request and respond with
            a quote. Availability is not confirmed until we reply.
          </p>
          <StoreContact />
        </div>
        <div className="space-y-8">
          <RentalAiHelper />
          <RentalForm />
        </div>
      </section>
    </>
  );
}
