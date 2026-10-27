import { neon } from "@neondatabase/serverless";
import { databaseUrl } from "../../db/index.ts";
// A single Postgres statement locks the order, deducts stock, and ships it.
// The order lock ensures two concurrent dispatches cannot deduct twice.
export async function dispatchOrder(
  id: string,
  expected: Record<string, unknown>,
  data: Record<string, unknown>,
) {
  const sql = neon(databaseUrl());
  const rows = await sql`
 WITH locked AS MATERIALIZED (
 SELECT id,data FROM commerce WHERE id=${id}::uuid AND kind='orders' AND data=${JSON.stringify(expected)}::jsonb FOR UPDATE
 ), deducted AS (
 UPDATE commerce AS stock SET data=jsonb_set(stock.data,'{quantity}',to_jsonb((stock.data->>'quantity')::integer-${Number(data.quantity)}))
 FROM locked WHERE stock.kind='inventory' AND stock.data->>'productId'=${String(data.productId)} AND (stock.data->>'quantity')::integer>=${Number(data.quantity)} RETURNING stock.id
 )
 UPDATE commerce SET data=${JSON.stringify(data)}::jsonb WHERE id IN (SELECT id FROM locked) AND EXISTS(SELECT 1 FROM deducted) RETURNING *`;
  const r = rows[0];
  return r
    ? { id: r.id, kind: r.kind, data: r.data, createdAt: r.created_at }
    : undefined;
}
