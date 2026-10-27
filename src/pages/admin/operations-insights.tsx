import { useState } from "react";
import { Download, ExternalLink, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  campaignMetrics,
  campaignLink,
  availableStock,
  amount,
} from "../../../db/store-operations";
import { downloadCsv } from "@/lib/export-csv";
import { money } from "@/hooks/use-commerce";
import type { CommerceRecord } from "../../../db/commerce-validation";
export default function OperationsInsights({
  kind,
  rows,
  productName,
}: {
  kind: "campaigns" | "inventory";
  rows: CommerceRecord[];
  productName: (id: unknown) => string;
}) {
  const [notice, setNotice] = useState("");
  if (kind === "inventory") {
    const onHand = rows.reduce((s, r) => s + amount(r.data.quantity), 0),
      reserved = rows.reduce((s, r) => s + amount(r.data.reserved), 0),
      known = rows.filter(
        (r) => r.data.unitCostZar !== null && r.data.unitCostZar !== undefined,
      ),
      value = known.reduce(
        (s, r) => s + amount(r.data.unitCostZar) * amount(r.data.quantity),
        0,
      );
    return (
      <section className="admin-panel space-y-4">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <h2 className="font-semibold">Stock control</h2>
            <p className="text-sm text-muted-foreground mt-2">
              {onHand} on hand · {reserved} reserved ·{" "}
              {Math.max(0, onHand - reserved)} available
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() =>
              downloadCsv("hawk-inventory.csv", [
                [
                  "Product",
                  "On hand",
                  "Reserved",
                  "Available",
                  "Reorder threshold",
                  "Unit cost ZAR",
                ],
                ...rows.map((r) => [
                  productName(r.data.productId),
                  r.data.quantity,
                  r.data.reserved ?? 0,
                  availableStock(r.data),
                  r.data.threshold,
                  r.data.unitCostZar ?? "",
                ]),
              ])
            }
          >
            <Download size={16} />
            Export inventory
          </Button>
        </div>
        <p className="text-sm">
          Recorded stock value: <strong>{money(value)}</strong>{" "}
          <span className="text-muted-foreground">
            ({known.length} of {rows.length} products have a cost recorded)
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          Low-stock alerts use available stock after reservations. Stock changes
          require a reason; edit a record to view its recent movement history.
        </p>
      </section>
    );
  }
  return (
    <section className="admin-panel space-y-5">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h2 className="font-semibold">Campaign performance</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Manually recorded platform metrics. These figures do not change
            order revenue.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            downloadCsv("hawk-campaigns.csv", [
              [
                "Campaign",
                "Channel",
                "Status",
                "Start",
                "End",
                "Budget ZAR",
                "Spend ZAR",
                "Revenue ZAR",
                "Impressions",
                "Clicks",
                "Conversions",
                "ROAS",
                "CTR %",
                "Conversion %",
                "CPC ZAR",
                "CPA ZAR",
                "Campaign URL",
              ],
              ...rows.map((r) => {
                const m = campaignMetrics(r.data);
                return [
                  r.data.name,
                  r.data.channel,
                  r.data.status,
                  r.data.startsOn,
                  r.data.endsOn,
                  r.data.budget,
                  r.data.spend,
                  r.data.revenue,
                  r.data.impressions ?? 0,
                  r.data.clicks,
                  r.data.conversions,
                  m.roas,
                  m.ctr,
                  m.conversionRate,
                  m.cpc,
                  m.cpa,
                  campaignLink(r.data),
                ];
              }),
            ])
          }
        >
          <Download size={16} />
          Export campaigns
        </Button>
      </div>
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
      <div className="grid lg:grid-cols-2 gap-4">
        {rows.map((r) => {
          const m = campaignMetrics(r.data),
            link = campaignLink(r.data);
          return (
            <article className="border p-4 space-y-4 rounded-lg" key={r.id}>
              <div>
                <h3 className="font-semibold">{String(r.data.name)}</h3>
                <p className="text-xs text-muted-foreground">
                  {String(r.data.startsOn || "Start not set")} →{" "}
                  {String(r.data.endsOn || "End not set")}
                </p>
              </div>
              <dl className="grid grid-cols-3 gap-4 text-xs">
                {[
                  ["ROAS", m.roas === null ? "—" : m.roas.toFixed(2) + "×"],
                  [
                    "Click-through",
                    m.ctr === null ? "—" : m.ctr.toFixed(2) + "%",
                  ],
                  [
                    "Conversion",
                    m.conversionRate === null
                      ? "—"
                      : m.conversionRate.toFixed(2) + "%",
                  ],
                  ["Cost / click", m.cpc === null ? "—" : money(m.cpc)],
                  ["Cost / conversion", m.cpa === null ? "—" : money(m.cpa)],
                  ["Budget remaining", money(m.remainingBudget)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-semibold mt-1">{v}</dd>
                  </div>
                ))}
              </dl>
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span>Budget used</span>
                  <span>
                    {m.budgetUsed === null
                      ? "No budget"
                      : m.budgetUsed.toFixed(0) + "%"}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded">
                  <div
                    className="h-full bg-primary rounded"
                    style={{ width: Math.min(100, m.budgetUsed ?? 0) + "%" }}
                  />
                </div>
                {(m.budgetUsed ?? 0) > 100 && (
                  <p className="text-xs text-destructive mt-2">
                    Over budget by{" "}
                    {money(amount(r.data.spend) - amount(r.data.budget))}
                  </p>
                )}
              </div>
              {link && (
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(link);
                        setNotice("Campaign link copied.");
                      } catch {
                        setNotice("Copy this campaign link: " + link);
                      }
                    }}
                  >
                    <LinkIcon size={14} />
                    Copy campaign link
                  </Button>
                  <a
                    className="text-xs text-primary underline inline-flex gap-2 items-center"
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open destination
                    <ExternalLink size={13} />
                  </a>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
