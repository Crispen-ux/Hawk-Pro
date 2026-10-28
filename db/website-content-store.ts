import { eq, sql } from "drizzle-orm";
import { getDb } from "./index.ts";
import { settings } from "./schema.ts";
import {
  contentSchema,
  DEFAULT_CONTENT,
  type WebsiteContent,
} from "./website-content.ts";
const KEY = "website-content";
export type ContentState = {
  draft: WebsiteContent;
  published: WebsiteContent;
  previous: WebsiteContent | null;
  revision: number;
};
export async function getContentState(): Promise<ContentState> {
  const [row] = await getDb()
    .select()
    .from(settings)
    .where(eq(settings.key, KEY))
    .limit(1);
  if (!row)
    return {
      draft: DEFAULT_CONTENT,
      published: DEFAULT_CONTENT,
      previous: null,
      revision: 0,
    };
  const state = row.value as ContentState;
  return {
    ...state,
    draft: contentSchema.parse(state.draft),
    published: contentSchema.parse(state.published),
  };
}
export async function changeContent(
  action: "save" | "publish" | "restore",
  content: WebsiteContent,
  revision: number,
) {
  const db = getDb();
  const current = await getContentState();
  if (current.revision !== revision) return null;
  const published =
    action === "publish"
      ? content
      : action === "restore"
        ? current.previous
        : current.published;
  if (!published) throw new Error("No previous published version available");
  const next: ContentState = {
    draft: action === "restore" ? published : content,
    published,
    previous: action === "save" ? current.previous : current.published,
    revision: revision + 1,
  };
  const updated = await db
    .insert(settings)
    .values({ key: KEY, value: next, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: next, updatedAt: new Date() },
      setWhere: sql`(${settings.value}->>'revision')::int = ${revision}`,
    })
    .returning({ key: settings.key });
  return updated.length ? next : null;
}
