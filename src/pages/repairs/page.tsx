import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ServiceOverview,
  EnquiryChecklist,
  ServiceFaq,
} from "../_components/service-content";
import { REPAIR_CONTENT } from "@/data/services";
import { HERO_CONTENT_CLASS } from "@/components/hero-layout";
import StoreContact from "@/components/layout/store-contact";
import RepairForm from "./_components/repair-form.tsx";
import ContentImage, { ContentOverlay } from "@/components/content-image";

export default function RepairsPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b">
        <ContentImage
          slot="repairs-hero"
          className="absolute inset-0 -z-20 size-full"
          priority
        />
        <ContentOverlay slot="repairs-hero" />
        <div className={HERO_CONTENT_CLASS}>
          <div className="w-full space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              Repairs and servicing
            </p>
            <h1 className="max-w-2xl text-balance font-serif text-5xl font-extrabold uppercase leading-none sm:text-6xl">
              Get your speakers back to work.
            </h1>
            <p className="max-w-xl text-muted-foreground">
              Diagnostics, repairs and maintenance for speakers and audio
              equipment.
            </p>
            <div className="flex flex-wrap gap-3 pt-3">
              <Button asChild size="lg">
                <a href="#enquiry">Request an assessment</a>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <a href="#how-it-works">How it works</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
      <ServiceOverview content={REPAIR_CONTENT} />
      <section
        id="enquiry"
        className="mx-auto grid max-w-7xl scroll-mt-24 gap-12 px-4 py-16 lg:grid-cols-[1fr_1.4fr] lg:px-8"
      >
        <div className="space-y-4 lg:col-span-2">
          <h2 className="font-serif text-4xl font-bold uppercase">
            Request a repair
          </h2>
          <p className="text-muted-foreground">
            Describe the fault and we'll assess it. Turnaround times and costs
            are provided after assessment.
          </p>
        </div>
        <aside className="order-2 space-y-5 lg:order-none">
          <EnquiryChecklist content={REPAIR_CONTENT} />
          <div className="border-t pt-5">
            <StoreContact />
          </div>
        </aside>
        <div className="order-1 lg:order-none">
          <RepairForm />
        </div>
      </section>
      <ServiceFaq content={REPAIR_CONTENT} />
      <div className="mx-auto max-w-7xl px-4 pb-14 lg:px-8">
        <Link
          className="text-sm font-semibold text-primary underline underline-offset-4"
          to="/resources/common-speaker-faults-and-what-they-mean"
        >
          Read our guide to common speaker faults →
        </Link>
      </div>
    </>
  );
}
