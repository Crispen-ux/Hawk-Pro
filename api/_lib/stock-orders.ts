import { neon } from "@neondatabase/serverless";
import { databaseUrl } from "../../db/index";
import { orderItems } from "../../db/checkout-model";
export type StoredOrder = {
  id: string;
  kind: string;
  data: Record<string, unknown>;
  createdAt: string;
};
function row(r: Record<string, unknown> | undefined): StoredOrder | undefined {
  return r
    ? {
        id: String(r.id),
        kind: String(r.kind),
        data: r.data as Record<string, unknown>,
        createdAt: String(r.created_at),
      }
    : undefined;
}
export async function reserveOrder(id: string, data: Record<string, unknown>) {
  const sql = neon(databaseUrl());
  const items = orderItems(data);
  const wanted = JSON.stringify(items);
  const rows = await sql`
 WITH wanted AS (SELECT * FROM jsonb_to_recordset(${wanted}::jsonb) AS x("productId" uuid,quantity integer,"unitPriceCents" bigint,version timestamptz)),
 locked_products AS MATERIALIZED (SELECT p.id FROM products p JOIN wanted w ON p.id=w."productId" WHERE p.published=true AND p.availability='in-stock' AND p.price_zar::bigint*100=w."unitPriceCents" AND date_trunc('milliseconds',p.updated_at)=w.version ORDER BY p.id FOR UPDATE OF p),
 locked_stock AS MATERIALIZED (SELECT stock.id FROM commerce stock JOIN wanted w ON stock.data->>'productId'=w."productId"::text WHERE stock.kind='inventory' AND (stock.data->>'quantity')::integer-COALESCE((stock.data->>'reserved')::integer,0)>=w.quantity AND (SELECT count(*) FROM locked_products)=${items.length} ORDER BY stock.id FOR UPDATE OF stock),
 inserted AS (INSERT INTO commerce(id,kind,data) SELECT ${id}::uuid,'orders',${JSON.stringify(data)}::jsonb WHERE (SELECT count(*) FROM locked_products)=${items.length} AND (SELECT count(*) FROM locked_stock)=${items.length} ON CONFLICT(id) DO NOTHING RETURNING *),
 reserved AS (UPDATE commerce stock SET data=jsonb_set(stock.data,'{reserved}',to_jsonb(COALESCE((stock.data->>'reserved')::integer,0)+w.quantity)) FROM wanted w,locked_stock l WHERE stock.id=l.id AND stock.data->>'productId'=w."productId"::text AND EXISTS(SELECT 1 FROM inserted) RETURNING stock.id)
 SELECT inserted.* FROM inserted WHERE (SELECT count(*) FROM reserved)=${items.length}`;
  return row(rows[0]);
}
export async function adjustOrderStock(
  id: string,
  expected: Record<string, unknown>,
  next: Record<string, unknown>,
  operation: "dispatch" | "release",
) {
  const sql = neon(databaseUrl());
  const items = orderItems(expected);
  const held = expected.stockReserved === true;
  if (operation === "release" && !held) {
    const rows =
      await sql`UPDATE commerce SET data=${JSON.stringify({ ...next, stockReserved: false })}::jsonb WHERE id=${id}::uuid AND kind='orders' AND data=${JSON.stringify(expected)}::jsonb RETURNING *`;
    return row(rows[0]);
  }
  const deduct = operation === "dispatch",
    release = held;
  const payload = { ...next, stockReserved: false };
  const rows = await sql`
 WITH locked_order AS MATERIALIZED (SELECT id FROM commerce WHERE id=${id}::uuid AND kind='orders' AND data=${JSON.stringify(expected)}::jsonb FOR UPDATE),
 wanted AS (SELECT * FROM jsonb_to_recordset(${JSON.stringify(items)}::jsonb) AS x("productId" uuid,quantity integer)),
 locked_stock AS MATERIALIZED (SELECT stock.id FROM commerce stock JOIN wanted w ON stock.data->>'productId'=w."productId"::text WHERE stock.kind='inventory' AND EXISTS(SELECT 1 FROM locked_order) AND (stock.data->>'quantity')::integer>=CASE WHEN ${deduct} THEN w.quantity ELSE 0 END AND CASE WHEN ${release} THEN COALESCE((stock.data->>'reserved')::integer,0)>=w.quantity ELSE (stock.data->>'quantity')::integer-COALESCE((stock.data->>'reserved')::integer,0)>=w.quantity END ORDER BY stock.id FOR UPDATE OF stock),
 changed AS (UPDATE commerce stock SET data=jsonb_set(jsonb_set(stock.data,'{quantity}',to_jsonb((stock.data->>'quantity')::integer-CASE WHEN ${deduct} THEN w.quantity ELSE 0 END)),'{reserved}',to_jsonb(COALESCE((stock.data->>'reserved')::integer,0)-CASE WHEN ${release} THEN w.quantity ELSE 0 END)) FROM wanted w,locked_stock l WHERE stock.id=l.id AND stock.data->>'productId'=w."productId"::text AND (SELECT count(*) FROM locked_stock)=${items.length} RETURNING stock.id)
 UPDATE commerce SET data=${JSON.stringify(payload)}::jsonb WHERE id IN(SELECT id FROM locked_order) AND (SELECT count(*) FROM changed)=${items.length} RETURNING *`;
  return row(rows[0]);
}
