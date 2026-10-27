import { sql } from "drizzle-orm";
import { getDb } from "../../db/index.ts";
import { authLimits } from "../../db/schema.ts";
export async function allowAuth(key: string, limit: number, windowMs: number) {
  const bucket = `${key}:${Math.floor(Date.now() / windowMs)}`;
  const [row] = await getDb()
    .insert(authLimits)
    .values({ key: bucket, count: 1 })
    .onConflictDoUpdate({
      target: authLimits.key,
      set: { count: sql`${authLimits.count}+1` },
    })
    .returning();
  return row.count <= limit;
}
