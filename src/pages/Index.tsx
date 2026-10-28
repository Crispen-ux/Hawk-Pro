import CraftVideo from "@/components/craft-video.tsx";
import Hero from "./_components/hero.tsx";
import {
  CategoriesSection,
  FeaturedProducts,
  MarqueeBand,
  ServicePanel,
  StorySection,
  TrustSection,
} from "./_components/sections.tsx";

export default function Index() {
  return (
    <>
      <Hero />
      <MarqueeBand />
      <CategoriesSection />
      <FeaturedProducts />
      <StorySection />
      <CraftVideo />
      <ServicePanel
        id="rentals"
        eyebrow="Rentals"
        title="Need sound for the day?"
        body="Hire speakers, subwoofers and related equipment for events, performances and functions. Send an enquiry and we'll get back to you. Availability is not confirmed until we respond."
        cta="Request a Rental Quote"
        to="/rentals#enquiry"
      />
      <ServicePanel
        id="repairs"
        eyebrow="Repairs"
        title="Diagnostics, repairs and servicing."
        body="Speaker faulty or underperforming? Tell us what's wrong and we'll assess it. Send a request with the details and, if you like, a photo."
        cta="Request a Repair"
        to="/repairs#enquiry"
        flip
      />
      <TrustSection />
    </>
  );
}
