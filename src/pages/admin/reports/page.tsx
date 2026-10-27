import { useState } from "react";
import {
  Download,
  Wallet,
  ShoppingBag,
  Package,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCommerce, money } from "@/hooks/use-commerce";
import { salesReport } from "../../../../db/store-operations";
import { downloadCsv } from "@/lib/export-csv";
const localDay = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
export default function ReportsPage() {
  const q = useCommerce();
  const [from, setFrom] = useState(() =>
      localDay(new Date(Date.now() - 29 * 86400000)),
    ),
    [to, setTo] = useState(() => localDay(new Date()));
  const valid = !!from && !!to && from <= to;
  const r = salesReport(q.data ?? [], from, to),
    span = valid ? Date.parse(to) - Date.parse(from) + 86400000 : 86400000,
    previous = salesReport(
      q.data ?? [],
      localDay(new Date(Date.parse(from || localDay(new Date())) - span)),
      localDay(new Date(Date.parse(from || localDay(new Date())) - 86400000)),
    );
  const growth = previous.netReceipts
    ? ((r.netReceipts - previous.netReceipts) /
        Math.abs(previous.netReceipts)) *
      100
    : null;
  return (
    <div className="p-5 lg:p-9 space-y-7 max-w-[1600px] mx-auto">
      <header className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Reports & business insights
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Recorded receipts, refunds and sales activity in South African time.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={!valid || !q.data}
          onClick={() =>
            downloadCsv("hawk-receipts-" + from + "-" + to + ".csv", [
              [
                "Order",
                "Created",
                "Payment date",
                "Status",
                "Payment",
                "Goods ZAR",
                "Shipping ZAR",
                "Included tax ZAR",
                "Total ZAR",
              ],
              ...r.paid.map((o) => [
                o.id,
                o.createdAt,
                o.data.paidAt ?? o.createdAt,
                o.data.status,
                o.data.payment,
                (
                  (Number(o.data.totalCents ?? Number(o.data.total) * 100) -
                    Number(o.data.shippingCents ?? 0)) /
                  100
                ).toFixed(2),
                (Number(o.data.shippingCents ?? 0) / 100).toFixed(2),
                (Number(o.data.taxIncludedCents ?? 0) / 100).toFixed(2),
                Number(o.data.total).toFixed(2),
              ]),
              ...r.refunded.map((o) => [
                o.id,
                o.createdAt,
                o.data.refundedAt ?? o.createdAt,
                "Refund recorded",
                "refunded",
                "",
                "",
                "",
                (-Number(o.data.total)).toFixed(2),
              ]),
            ])
          }
        >
          <Download size={16} />
          Export receipts & refunds
        </Button>
      </header>
      <div className="admin-panel flex flex-wrap items-end gap-4">
        <label className="text-sm">
          From
          <Input
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="text-sm">
          To
          <Input
            type="date"
            value={to}
            min={from}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        {[7, 30, 90, 365].map((days) => (
          <Button
            key={days}
            variant="outline"
            onClick={() => {
              setFrom(localDay(new Date(Date.now() - (days - 1) * 86400000)));
              setTo(localDay(new Date()));
            }}
          >
            Last {days} days
          </Button>
        ))}
      </div>
      {!valid && <p role="alert">Choose a valid date range.</p>}
      {q.error && (
        <div role="alert" className="admin-panel">
          {q.error.message}
          <Button onClick={() => void q.refetch()}>Retry</Button>
        </div>
      )}
      {q.isPending && <p role="status">Loading reports…</p>}
      {valid && (
        <>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              ["Gross recorded receipts", money(r.revenue), Wallet],
              ["Recorded refunds", money(r.refunds), ArrowUpRight],
              ["Receipts less refunds", money(r.netReceipts), Wallet],
              ["New orders / requests", r.created.length, ShoppingBag],
            ].map(([label, value, Icon]) => {
              const I = Icon as typeof Wallet;
              return (
                <div key={String(label)} className="admin-panel">
                  <I className="text-primary mb-4" size={20} />
                  <p className="text-xs text-muted-foreground">
                    {String(label)}
                  </p>
                  <p className="text-2xl font-semibold mt-2">{String(value)}</p>
                </div>
              );
            })}
          </div>
          <section className="admin-panel">
            <h2 className="font-semibold">
              Compared with the preceding {Math.round(span / 86400000)} days
            </h2>
            <p className="text-3xl mt-3">
              {growth === null
                ? "No comparison available"
                : (growth >= 0 ? "+" : "") + growth.toFixed(1) + "%"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Previous receipts less refunds: {money(previous.netReceipts)}
            </p>
          </section>
          <div className="grid lg:grid-cols-2 gap-6">
            <section className="admin-panel space-y-4">
              <h2 className="font-semibold">Receipt breakdown</h2>
              <dl className="space-y-3">
                {[
                  ["Goods value", money(r.goodsRevenue)],
                  ["Delivery charges", money(r.shipping)],
                  ["Included tax (when configured)", money(r.tax)],
                  ["Average receipt", money(r.average)],
                  ["Sale units / packs", r.units],
                  ["Quote requests", r.quotes],
                  ["Unpaid order value (known prices)", money(r.outstanding)],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between gap-3 text-sm border-b pb-3"
                  >
                    <dt>{k}</dt>
                    <dd className="font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className="admin-panel">
              <h2 className="font-semibold flex gap-2">
                <Package size={18} />
                Top products by sale units
              </h2>
              {r.top.length ? (
                <ol className="mt-5 space-y-4">
                  {r.top.slice(0, 10).map((p, i) => (
                    <li
                      key={p.name + i}
                      className="flex justify-between border-b pb-3 text-sm"
                    >
                      <span>
                        {i + 1}. {p.name}
                      </span>
                      <span>{p.quantity} units</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground mt-8">
                  Paid orders will populate this report.
                </p>
              )}
            </section>
          </div>
          <p className="text-xs text-muted-foreground">
            This is an operational report, not a profit or tax return. Receipt
            dates use recorded payment dates, with creation dates for legacy
            orders. Refunds use their recorded dates and represent full-order
            refunds only. Quote requests are excluded from receipts. Marketing
            attribution is reported separately. Tax is already included in
            receipts; it is not an additional charge.
          </p>
        </>
      )}
    </div>
  );
}
