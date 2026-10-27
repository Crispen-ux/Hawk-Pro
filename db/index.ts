import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema.ts";

// Vercel Postgres (Neon-backed) exposes POSTGRES_URL; a plain Neon project
// exposes DATABASE_URL. Local runs read .env / .env.local the same way.
export const DATABASE_ENV_KEYS = ["POSTGRES_URL", "DATABASE_URL"] as const;

export function databaseUrl(): string {
  for (const key of DATABASE_ENV_KEYS) {
    const value = process.env[key];
    if (value) return value;
  }
  throw new Error(
    `Missing database connection: set ${DATABASE_ENV_KEYS.join(" or ")} (run \`vercel env pull\` locally, or add Vercel Postgres in the dashboard).`,
  );
}

let client: ReturnType<typeof neon> | undefined;
let db: NeonHttpDatabase<typeof schema> | undefined;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!db) {
    const url = databaseUrl();
    client ??= neon(url);
    db = drizzle({ client, schema });
  }
  return db;
}
