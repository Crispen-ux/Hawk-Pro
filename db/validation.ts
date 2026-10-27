import { z } from "zod";

// Shared between the Vercel API handlers and the admin form so both sides
// validate the same way. Kept free of framework imports on purpose.

// Header the admin UI sends with every write request.
export const ADMIN_PASSCODE_HEADER = "x-admin-passcode";

export const PRODUCT_CATEGORIES = [
  "speakers",
  "subwoofers",
  "accessories",
  "systems",
] as const;

export const PRODUCT_AVAILABILITY = ["coming-soon", "tbc"] as const;

export const ENQUIRY_KINDS = ["rental", "repair"] as const;

export const ENQUIRY_STATUSES = ["new", "contacted", "closed"] as const;

export const productSpecSchema = z.object({
  label: z.string().trim().min(1, "Enter a specification name"),
  value: z.string().trim().min(1, "Enter a value"),
});
export type ProductSpecRow = z.infer<typeof productSpecSchema>;

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and hyphens",
  );

export const productInputSchema = z.object({
  name: z.string().trim().min(2, "Enter a product name").max(160),
  slug: slugSchema,
  category: z.enum(PRODUCT_CATEGORIES),
  priceZar: z
    .number({ error: "Enter a price" })
    .int("Price must be a whole number of rands")
    .min(0)
    .max(100_000_000),
  shortDescription: z
    .string()
    .trim()
    .min(10, "Write a one-line summary")
    .max(200),
  description: z
    .string()
    .trim()
    .min(20, "Write a longer description")
    .max(4000),
  availability: z.enum(PRODUCT_AVAILABILITY),
  images: z
    .array(z.string().trim().url("Enter a valid image URL"))
    .max(8, "Up to 8 images"),
  specs: z.array(productSpecSchema).max(24, "Up to 24 specifications"),
  published: z.boolean(),
});

export type ProductInput = z.infer<typeof productInputSchema>;

// JSON shapes the API returns (dates arrive as ISO strings).
export type ProductRecord = ProductInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type EnquiryKind = (typeof ENQUIRY_KINDS)[number];
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];
export type EnquiryRecord = {
  id: string;
  kind: EnquiryKind;
  status: EnquiryStatus;
  payload: Record<string, string>;
  createdAt: string;
};

export const productPatchSchema = productInputSchema.partial().extend({
  id: z.string().uuid().optional(),
});

export const enquiryInputSchema = z.object({
  kind: z.enum(ENQUIRY_KINDS),
  payload: z
    .record(z.string(), z.string().max(2000))
    .refine(
      (record) => Object.values(record).some((v) => v.trim().length > 0),
      "Send at least one field",
    ),
});

export type EnquiryInput = z.infer<typeof enquiryInputSchema>;

export const enquiryStatusSchema = z.object({
  status: z.enum(ENQUIRY_STATUSES),
});

export const announcementSchema = z.object({
  announcement: z.string().trim().min(3).max(160),
});

export const contactSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(160),
  phone: z.string().trim().min(6).max(60),
  address: z.string().trim().min(3).max(200),
  hours: z.string().trim().min(3).max(1000),
});

const CONTACT_DEFAULTS = {
  email: "hello@your-domain.co.za",
  phone: "+27 (0)00 000 0000",
  address: "Business address to be confirmed",
  hours: "Trading hours to be confirmed",
};
export const storeSchema = z.object({
  name: z.string().trim().min(2, "Enter your store name").max(80),
  tagline: z.string().trim().min(3, "Enter a store tagline").max(200),
});
export const settingsSchema = z
  .object({
    announcement: announcementSchema.shape.announcement,
    contact: contactSchema,
    store: storeSchema.default({
      name: "HAWK",
      tagline:
        "Speakers, subwoofers and professional audio. Rentals and repairs.",
    }),
    onboardingCompleted: z.boolean().default(false),
    onboardingStep: z.number().int().min(0).max(3).default(0),
  })
  .superRefine((value, ctx) => {
    if (!value.onboardingCompleted) return;
    for (const key of ["email", "phone", "address", "hours"] as const) {
      if (value.contact[key] === CONTACT_DEFAULTS[key])
        ctx.addIssue({
          code: "custom",
          path: ["contact", key],
          message: "Replace the placeholder with your store's actual details",
        });
    }
  });
export type SettingsInput = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: SettingsInput = {
  store: {
    name: "HAWK",
    tagline:
      "Speakers, subwoofers and professional audio. Rentals and repairs.",
  },
  onboardingCompleted: false,
  onboardingStep: 0,
  announcement: "Engineered for Sound. Built for Performance.",
  contact: {
    email: "hello@your-domain.co.za",
    phone: "+27 (0)00 000 0000",
    address: "Business address to be confirmed",
    hours: "Trading hours to be confirmed",
  },
};

// Turns arbitrary stored JSON into settings, falling back to the shipped
// defaults so a fresh database still renders a complete footer and banner.
export function normaliseSettings(raw: unknown): SettingsInput {
  const parsed = settingsSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  const obj =
    typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>)
      : {};
  const contact =
    typeof obj.contact === "object" && obj.contact !== null
      ? (obj.contact as Record<string, unknown>)
      : {};
  return {
    store: storeSchema.safeParse(obj.store).success
      ? storeSchema.parse(obj.store)
      : DEFAULT_SETTINGS.store,
    onboardingCompleted: false,
    onboardingStep: 0,
    announcement:
      typeof obj.announcement === "string"
        ? obj.announcement
        : DEFAULT_SETTINGS.announcement,
    contact: {
      email:
        typeof contact.email === "string"
          ? contact.email
          : DEFAULT_SETTINGS.contact.email,
      phone:
        typeof contact.phone === "string"
          ? contact.phone
          : DEFAULT_SETTINGS.contact.phone,
      address:
        typeof contact.address === "string"
          ? contact.address
          : DEFAULT_SETTINGS.contact.address,
      hours:
        typeof contact.hours === "string"
          ? contact.hours
          : DEFAULT_SETTINGS.contact.hours,
    },
  };
}
