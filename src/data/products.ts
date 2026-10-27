import { IMAGES, unsplash } from "./site.ts";
import type { ProductRecord } from "../../db/validation.ts";

export type { ProductRecord, ProductInput } from "../../db/validation.ts";

// Categories and availability labels are fixed for the storefront; the
// products themselves come from the database (see hooks/use-catalogue.tsx).

export type CategoryId = "speakers" | "subwoofers" | "accessories" | "systems";

export type Availability = "coming-soon" | "tbc";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: CategoryId;
  priceZar: number;
  shortDescription: string;
  description: string;
  availability: Availability;
  images: string[];
  specs: { label: string; value: string }[];
};

export type Category = {
  id: CategoryId;
  name: string;
  description: string;
  image: string;
};

export const CATEGORIES: Category[] = [
  {
    id: "speakers",
    name: "HAWK Speakers",
    description: "Full-range cabinets built for clear, powerful projection.",
    image: unsplash(IMAGES.speakerB, 900),
  },
  {
    id: "subwoofers",
    name: "Subwoofers",
    description: "Low-frequency output to anchor your system.",
    image: unsplash(IMAGES.box, 900),
  },
  {
    id: "accessories",
    name: "Audio Accessories",
    description: "Stands, cabling and the essentials that complete a rig.",
    image: unsplash(IMAGES.mixerB, 900),
  },
  {
    id: "systems",
    name: "Complete Sound Systems",
    description: "Matched speaker and subwoofer packages.",
    image: unsplash(IMAGES.stack, 900),
  },
];

export function findProductBySlug(
  products: ProductRecord[],
  slug: string,
): ProductRecord | undefined {
  return products.find((p) => p.slug === slug);
}

export function getRelatedProducts(
  products: ProductRecord[],
  product: Product | ProductRecord,
  limit = 4,
): ProductRecord[] {
  const sameCategory = products.filter(
    (p) => p.id !== product.id && p.category === product.category,
  );
  const others = products.filter(
    (p) => p.id !== product.id && p.category !== product.category,
  );
  return [...sameCategory, ...others].slice(0, limit);
}

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  "coming-soon": "Coming soon",
  tbc: "Availability to be confirmed",
};
