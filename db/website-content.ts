import { z } from "zod";
import { IMAGES, unsplash } from "./website-assets.ts";
const mediaUrl = z
  .string()
  .max(2048)
  .refine(
    (v) =>
      v === "" ||
      (v.startsWith("/") && !v.startsWith("//") && !v.includes("\\")) ||
      /^https:\/\//.test(v),
    "Use an HTTPS URL or a local asset path",
  );
const destination = z
  .string()
  .max(500)
  .refine(
    (v) => v.startsWith("/") && !v.startsWith("//") && !v.includes("\\"),
    "Use a storefront path starting with /",
  );
export const frameSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  zoom: z.number().min(0.1).max(3),
});
export const imageSchema = z.object({
  src: mediaUrl.refine((v) => v.length > 0, "Choose an image"),
  alt: z.string().max(300),
  desktop: frameSchema,
  mobile: frameSchema,
  overlay: z.number().min(0).max(90),
});
export const SLOTS = {
  "home-hero": [
    "Home",
    "Hero",
    IMAGES.hero,
    "Black professional PA speakers",
    "2000 × 1100",
  ],
  "category-speakers": [
    "Home",
    "Speakers category",
    IMAGES.speakerB,
    "HAWK speakers",
    "1200 × 1500",
  ],
  "category-subwoofers": [
    "Home",
    "Subwoofers category",
    IMAGES.box,
    "Subwoofers",
    "1200 × 900",
  ],
  "category-accessories": [
    "Home",
    "Audio accessories category",
    IMAGES.mixerB,
    "Audio accessories",
    "1200 × 900",
  ],
  "category-systems": [
    "Home",
    "Complete sound systems category",
    IMAGES.stack,
    "Complete sound systems",
    "1200 × 900",
  ],
  "home-brand": [
    "Home",
    "The brand",
    IMAGES.mesh,
    "Close-up of a speaker grille",
    "1200 × 900",
  ],
  "home-rentals": [
    "Home",
    "Rentals section",
    IMAGES.arrays,
    "Rental sound equipment",
    "1200 × 900",
  ],
  "home-repairs": [
    "Home",
    "Repairs and diagnostics section",
    IMAGES.repair,
    "Audio repairs",
    "1200 × 900",
  ],
  "rentals-hero": [
    "Rentals",
    "Hero",
    IMAGES.wall,
    "Sound equipment for hire",
    "2000 × 900",
  ],
  "repairs-hero": [
    "Repairs",
    "Hero",
    IMAGES.solder,
    "Speaker servicing",
    "2000 × 900",
  ],
  "about-main": [
    "About",
    "Main image",
    IMAGES.speakerB,
    "HAWK professional audio",
    "2000 × 860",
  ],
} as const;
export type Slot = keyof typeof SLOTS;
export const SLOT_IDS = Object.keys(SLOTS) as Slot[];
export const DEFAULT_FRAME = { x: 50, y: 50, zoom: 1 };
export type ContentImage = z.infer<typeof imageSchema>;
const date = z
  .string()
  .refine(
    (v) =>
      !v || (!Number.isNaN(Date.parse(v)) && /(?:Z|[+-]\d{2}:\d{2})$/.test(v)),
    "Use a date with timezone",
  );
export const promotionSchema = z
  .object({
    id: z.string().min(1).max(100),
    enabled: z.boolean(),
    placement: z.enum(["strip", "home", "shop"]),
    title: z.string().min(1).max(160),
    body: z.string().max(500),
    button: z.string().max(60),
    href: destination,
    image: mediaUrl,
    start: date,
    end: date,
  })
  .refine(
    (v) => !v.start || !v.end || Date.parse(v.end) > Date.parse(v.start),
    { message: "End must be after start", path: ["end"] },
  );
export const contentSchema = z.object({
  images: z.object(
    Object.fromEntries(SLOT_IDS.map((id) => [id, imageSchema])) as Record<
      Slot,
      typeof imageSchema
    >,
  ),
  hero: z.object({
    title: z.string().min(1).max(160),
    body: z.string().max(600),
    button: z.string().min(1).max(60),
    href: destination,
  }),
  video: z
    .object({
      enabled: z.boolean(),
      src: mediaUrl,
      poster: mediaUrl,
      title: z.string().max(160),
      body: z.string().max(600),
    })
    .refine((v) => !v.enabled || !!v.src, {
      message: "Add a video URL before enabling the section",
      path: ["src"],
    }),
  library: z
    .array(z.object({ url: mediaUrl, name: z.string().max(200) }))
    .max(100),
  promotions: z.array(promotionSchema).max(12),
});
export type WebsiteContent = z.infer<typeof contentSchema>;
export const DEFAULT_CONTENT: WebsiteContent = {
  images: Object.fromEntries(
    SLOT_IDS.map((id) => [
      id,
      {
        src: unsplash(SLOTS[id][2], 2000),
        alt: SLOTS[id][3],
        desktop: { ...DEFAULT_FRAME },
        mobile: { ...DEFAULT_FRAME },
        overlay: id === "home-hero" ? 45 : id.endsWith("hero") ? 75 : 0,
      },
    ]),
  ) as WebsiteContent["images"],
  hero: {
    title: "Built to move sound.",
    body: "Discover powerful audio equipment engineered for performance, reliability and unforgettable sound.",
    button: "Shop Speakers",
    href: "/shop?category=speakers",
  },
  video: {
    enabled: false,
    src: "",
    poster: "",
    title: "Precision, cut by cut.",
    body: "A look at how speaker cabinets take shape: wood, cut with care on a CNC machine.",
  },
  library: [],
  promotions: [],
};
export function promotionActive(
  p: WebsiteContent["promotions"][number],
  now = Date.now(),
) {
  return (
    p.enabled &&
    (!p.start || Date.parse(p.start) <= now) &&
    (!p.end || now < Date.parse(p.end))
  );
}
