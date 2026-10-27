import { desc, eq } from "drizzle-orm";
import { getDb } from "./index.ts";
import { enquiries, type EnquiryRow, type NewEnquiryRow } from "./schema.ts";

export async function listEnquiries(): Promise<EnquiryRow[]> {
  const db = getDb();
  return db.select().from(enquiries).orderBy(desc(enquiries.createdAt));
}

export async function createEnquiry(input: NewEnquiryRow): Promise<EnquiryRow> {
  const db = getDb();
  const rows = await db.insert(enquiries).values(input).returning();
  const created = rows[0];
  if (!created) throw new Error("Enquiry was not recorded");
  return created;
}

export async function setEnquiryStatus(
  id: string,
  status: string,
): Promise<EnquiryRow | undefined> {
  const db = getDb();
  const rows = await db
    .update(enquiries)
    .set({ status })
    .where(eq(enquiries.id, id))
    .returning();
  return rows[0];
}
