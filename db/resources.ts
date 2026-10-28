// Editorial content for the Resources hub. General audio education only: no product claims.
// Review and edit before publishing; add real HAWK expertise, photos and case studies over time.

export type Block =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

export type CtaTarget = "rentals" | "repairs" | "shop";

export type Article = {
  slug: string;
  title: string;
  description: string;
  category: "Buying guide" | "Rentals" | "Repairs" | "Setup";
  readMinutes: number;
  publishedAt: string; // ISO 8601 UTC
  cta: CtaTarget;
  body: Block[];
};

export const CTA_COPY: Record<
  CtaTarget,
  { heading: string; text: string; label: string; to: string }
> = {
  rentals: {
    heading: "Planning an event?",
    text: "Tell us about it and we'll respond with a quote. Availability is not confirmed until we reply.",
    label: "Request a Rental Quote",
    to: "/rentals#enquiry",
  },
  repairs: {
    heading: "Speaker not sounding right?",
    text: "Describe the fault and we'll assess it.",
    label: "Request a Repair",
    to: "/repairs#enquiry",
  },
  shop: {
    heading: "Ready to look at speakers?",
    text: "Browse the HAWK range of speakers, subwoofers and accessories.",
    label: "Shop Speakers",
    to: "/shop?category=speakers",
  },
};

export const ARTICLES: Article[] = [
  {
    slug: "how-to-choose-pa-speakers",
    title: "How to choose PA speakers for your venue",
    description:
      "A plain-language guide to choosing PA speakers: room size, audience, power, active versus passive, and when you need a subwoofer.",
    category: "Buying guide",
    readMinutes: 5,
    publishedAt: "2026-10-01T08:00:00Z",
    cta: "shop",
    body: [
      {
        type: "p",
        text: "Choosing PA speakers is easier when you start with the room and the audience, not the spec sheet. These are the questions worth answering first.",
      },
      { type: "h2", text: "1. What will you be amplifying?" },
      {
        type: "p",
        text: "Speech needs clarity more than bass. Live bands and DJs need more output and low-frequency extension. Write down the main use before comparing models.",
      },
      { type: "h2", text: "2. How big is the space and how many people?" },
      {
        type: "ul",
        items: [
          "Small rooms and bars can often work with a pair of compact speakers.",
          "Halls and outdoor events usually need more speakers or more output, and often a subwoofer.",
          "More people absorb sound, so a full room needs more level than an empty one.",
        ],
      },
      { type: "h2", text: "3. Active or passive?" },
      {
        type: "p",
        text: "Active speakers have the amplifier built in, which keeps setup simple. Passive speakers need separate amplifiers and cabling, which gives flexibility but more to match correctly.",
      },
      { type: "h2", text: "4. Do you need a subwoofer?" },
      {
        type: "p",
        text: "If you play music with strong bass, a subwoofer takes the low frequencies off the main speakers and usually makes the whole system sound cleaner at higher volume.",
      },
      { type: "h2", text: "5. Work out the numbers" },
      {
        type: "p",
        text: "Our free Tools page estimates the amplifier power and loudness you need from a speaker's sensitivity and your listening distance. Always check figures against the manufacturer's data sheet.",
      },
    ],
  },
  {
    slug: "what-to-know-before-renting-pa-equipment",
    title: "What to know before you rent PA equipment",
    description:
      "A checklist for hiring speakers and sound gear for an event: what to tell the supplier, what to ask, and how to avoid last-minute problems.",
    category: "Rentals",
    readMinutes: 4,
    publishedAt: "2026-10-05T08:00:00Z",
    cta: "rentals",
    body: [
      {
        type: "p",
        text: "Hiring sound equipment goes smoothly when the supplier knows exactly what you need. Use this checklist before you request a quote.",
      },
      { type: "h2", text: "Details to have ready" },
      {
        type: "ul",
        items: [
          "Event date, start time and set-up time.",
          "Venue type and location, indoors or outdoors.",
          "Approximate number of guests.",
          "What will be played or spoken: music, speeches, live band.",
          "Power availability at the venue.",
          "Whether you need a technician on site.",
        ],
      },
      { type: "h2", text: "Questions to ask" },
      {
        type: "ul",
        items: [
          "What is included: cables, stands, microphones?",
          "How is delivery, set-up and collection handled?",
          "What happens if equipment is damaged or fails?",
          "Is a deposit required, and when is it refunded?",
        ],
      },
      { type: "h2", text: "Book early" },
      {
        type: "p",
        text: "Popular dates fill up. Send your enquiry as early as you can. Equipment is only reserved once the supplier confirms it in writing.",
      },
    ],
  },
  {
    slug: "common-speaker-faults-and-what-they-mean",
    title: "Common speaker faults and what they might mean",
    description:
      "Distortion, buzzing, no sound or a cutting-out speaker: the usual causes, what is safe to check yourself, and when to send it for repair.",
    category: "Repairs",
    readMinutes: 4,
    publishedAt: "2026-10-08T08:00:00Z",
    cta: "repairs",
    body: [
      {
        type: "p",
        text: "A speaker fault is not always a dead speaker. Here are common symptoms and what a technician may check. This is general guidance, not a diagnosis.",
      },
      { type: "h2", text: "No sound" },
      {
        type: "ul",
        items: [
          "Check power, source and cables first.",
          "On active speakers a protection circuit can switch the output off.",
          "A damaged driver or internal connection may be the cause.",
        ],
      },
      { type: "h2", text: "Distortion or crackling" },
      {
        type: "ul",
        items: [
          "Driving the speaker too hard can overload it.",
          "A damaged cone or voice coil can cause rattling or scratching.",
          "Loose or corroded connectors often cause crackling.",
        ],
      },
      { type: "h2", text: "Buzzing or humming" },
      {
        type: "p",
        text: "This is often an earthing or cable issue, but can also come from inside the speaker.",
      },
      { type: "h2", text: "Safety" },
      {
        type: "p",
        text: "Do not open powered speakers or amplifiers yourself. They contain mains voltage. Switch off, unplug and have a technician look at it.",
      },
    ],
  },
  {
    slug: "active-vs-passive-speakers",
    title: "Active vs passive speakers: which is right for you?",
    description:
      "The practical differences between active and passive speakers, with simple guidance on cost, setup, portability and flexibility.",
    category: "Buying guide",
    readMinutes: 3,
    publishedAt: "2026-10-12T08:00:00Z",
    cta: "shop",
    body: [
      { type: "h2", text: "Active speakers" },
      {
        type: "ul",
        items: [
          "Amplifier built in and matched to the speaker.",
          "Fewer cables, quicker set-up.",
          "Good for mobile DJs, bands and one-person setups.",
        ],
      },
      { type: "h2", text: "Passive speakers" },
      {
        type: "ul",
        items: [
          "Need a separate power amplifier.",
          "Flexible: upgrade amplifiers or speakers independently.",
          "Common in installed systems and larger rigs.",
        ],
      },
      { type: "h2", text: "Which should you pick?" },
      {
        type: "p",
        text: "If you want to plug in and play, active is usually simpler. If you are building a larger or permanent system, passive can make sense. When in doubt, describe your use and ask us.",
      },
    ],
  },
  {
    slug: "subwoofer-placement-basics",
    title: "Subwoofer placement basics",
    description:
      "Where to put a subwoofer for tighter, more even bass, plus why room size and shape change how bass sounds.",
    category: "Setup",
    readMinutes: 3,
    publishedAt: "2026-10-15T08:00:00Z",
    cta: "shop",
    body: [
      {
        type: "p",
        text: "Bass behaves differently from other frequencies. Placement can change how a subwoofer sounds more than almost anything else.",
      },
      { type: "h2", text: "Start simple" },
      {
        type: "ul",
        items: [
          "Try the subwoofer near the main speakers first.",
          "Placing it against a wall or in a corner increases bass but can make it boomy.",
          "Move it, listen, and move it again. Small shifts matter.",
        ],
      },
      { type: "h2", text: "Understand your room" },
      {
        type: "p",
        text: "Rooms have resonant frequencies that make some notes louder and others weaker. Our Room modes tool shows where they fall for your room's dimensions.",
      },
      { type: "h2", text: "Keep it in phase" },
      {
        type: "p",
        text: "If bass sounds thin when the subwoofer is on, try flipping its polarity switch or adjusting delay so it lines up with the main speakers.",
      },
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
