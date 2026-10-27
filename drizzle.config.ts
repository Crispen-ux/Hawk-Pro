import { defineConfig } from "drizzle-kit";

// Migrations are generated with `pnpm db:generate` (no connection needed);
// `pnpm db:push` applies them straight to the configured database.
export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dbCredentials: {
    url: process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
