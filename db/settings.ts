import { eq } from "drizzle-orm";
import { getDb } from "./index.ts";
import { settings } from "./schema.ts";
import {
  DEFAULT_SETTINGS,
  normaliseSettings,
  type SettingsInput,
} from "./validation.ts";

const SETTINGS_KEY = "site";

export async function getSettings(): Promise<SettingsInput> {
  const db = getDb();
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, SETTINGS_KEY))
    .limit(1);
  const row = rows[0];
  if (!row) return DEFAULT_SETTINGS;
  return normaliseSettings(row.value);
}

export async function saveSettings(input: SettingsInput): Promise<void> {
  const db = getDb();
  await db
    .insert(settings)
    .values({ key: SETTINGS_KEY, value: input, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: input, updatedAt: new Date() },
    });
}
