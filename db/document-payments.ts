import { eq } from "drizzle-orm";
import { getDb } from "./index.ts";
import { settings } from "./schema.ts";
import {
  documentPaymentsSchema,
  DEFAULT_DOCUMENT_PAYMENTS,
  type DocumentPayments,
} from "./document-payments-validation.ts";
const KEY = "document-payments";
export async function getDocumentPayments(): Promise<DocumentPayments> {
  const [row] = await getDb()
    .select()
    .from(settings)
    .where(eq(settings.key, KEY))
    .limit(1);
  if (!row) return DEFAULT_DOCUMENT_PAYMENTS;
  return documentPaymentsSchema.parse(row.value);
}
export async function saveDocumentPayments(value: DocumentPayments) {
  await getDb()
    .insert(settings)
    .values({ key: KEY, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: new Date() },
    });
}
