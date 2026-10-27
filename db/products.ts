import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./index.ts";
import { products, type NewProductRow, type ProductRow } from "./schema.ts";
import type { ProductInput } from "./validation.ts";

function toRow(input: ProductInput): NewProductRow {
  return {
    name: input.name,
    slug: input.slug,
    category: input.category,
    priceZar: input.priceZar,
    shortDescription: input.shortDescription,
    description: input.description,
    availability: input.availability,
    images: input.images,
    specs: input.specs,
    published: input.published,
    updatedAt: new Date(),
  };
}

export class DuplicateSlugError extends Error {
  constructor() {
    super("That slug is already in use");
    this.name = "DuplicateSlugError";
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

export async function listProducts(options?: {
  publishedOnly?: boolean;
}): Promise<ProductRow[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(products)
    .where(options?.publishedOnly ? eq(products.published, true) : undefined)
    .orderBy(desc(products.createdAt));
  return rows;
}

export async function getProduct(id: string): Promise<ProductRow | undefined> {
  const db = getDb();
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  return rows[0];
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductRow | undefined> {
  const db = getDb();
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.published, true)))
    .limit(1);
  return rows[0];
}

export async function createProduct(input: ProductInput): Promise<ProductRow> {
  const db = getDb();
  try {
    const rows = await db.insert(products).values(toRow(input)).returning();
    const created = rows[0];
    if (!created) throw new Error("Product was not created");
    return created;
  } catch (error) {
    if (isUniqueViolation(error)) throw new DuplicateSlugError();
    throw error;
  }
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<ProductRow | undefined> {
  const db = getDb();
  try {
    const rows = await db
      .update(products)
      .set(toRow(input))
      .where(eq(products.id, id))
      .returning();
    return rows[0];
  } catch (error) {
    if (isUniqueViolation(error)) throw new DuplicateSlugError();
    throw error;
  }
}

export async function deleteProduct(
  id: string,
): Promise<ProductRow | undefined> {
  const db = getDb();
  const rows = await db.delete(products).where(eq(products.id, id)).returning();
  return rows[0];
}
