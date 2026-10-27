import OrderDocument from "./order-document";
import OperationsInsights from "./operations-insights";
import {
  availableStock,
  fulfillmentEvents,
} from "../../../db/store-operations";
import { useSearchParams } from "react-router-dom";
import { orderItems } from "../../../db/checkout-model";
import { request } from "@/lib/api";
import { useState } from "react";
import { Plus, Search, Pencil, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  useCommerce,
  useAdminProducts,
  useSaveCommerce,
  money,
} from "@/hooks/use-commerce";
import type {
  CommerceKind,
  CommerceRecord,
} from "../../../db/commerce-validation";
type Field = {
  key: string;
  label: string;
  type?: string;
  options?: string[];
  required?: boolean;
};
const fields: Record<CommerceKind, Field[]> = {
  orders: [
    { key: "name", label: "Customer name", required: true },
    { key: "email", label: "Customer email", type: "email", required: true },
    { key: "productId", label: "Product", type: "product", required: true },
    { key: "quantity", label: "Quantity", type: "number", required: true },
    { key: "address", label: "Delivery address", required: true },
    {
      key: "status",
      label: "Fulfillment",
      options: ["pending", "processing", "shipped", "delivered", "cancelled"],
    },
    {
      key: "payment",
      label: "Payment status",
      options: ["unpaid", "paid", "refunded"],
    },
    {
      key: "documentPaymentMethod",
      label: "Payment options on quote / invoice",
      options: ["none", "bank-transfer", "cash", "bank-transfer-or-cash"],
    },
    {
      key: "paymentReference",
      label: "Bank / cash payment reference (optional)",
    },
    { key: "tracking", label: "Tracking reference" },
    { key: "courier", label: "Courier name" },
    { key: "trackingUrl", label: "Courier tracking URL (HTTPS)", type: "url" },
    {
      key: "estimatedDelivery",
      label: "Estimated delivery date",
      type: "date",
    },
  ],
  customers: [
    { key: "name", label: "Full name", required: true },
    { key: "email", label: "Email address", type: "email", required: true },
    { key: "phone", label: "Phone number" },
    { key: "notes", label: "Customer notes" },
    {
      key: "consent",
      label: "Customer has consented to marketing",
      type: "checkbox",
    },
  ],
  inventory: [
    {
      key: "adjustmentReason",
      label: "Reason for stock change",
      required: true,
    },
    { key: "unitCostZar", label: "Unit cost (ZAR, optional)", type: "number" },
    { key: "productId", label: "Product", type: "product", required: true },
    {
      key: "quantity",
      label: "Sale units / packs on hand",
      type: "number",
      required: true,
    },
    {
      key: "threshold",
      label: "Low-stock alert threshold",
      type: "number",
      required: true,
    },
  ],
  campaigns: [
    { key: "name", label: "Campaign name", required: true },
    {
      key: "channel",
      label: "Channel",
      options: ["Email", "Social", "Search", "Other"],
    },
    {
      key: "status",
      label: "Status",
      options: ["Draft", "Active", "Completed"],
    },
    { key: "budget", label: "Budget (ZAR)", type: "number" },
    { key: "spend", label: "Spend (ZAR)", type: "number" },
    { key: "impressions", label: "Impressions", type: "number" },
    { key: "startsOn", label: "Start date", type: "date" },
    { key: "endsOn", label: "End date", type: "date" },
    { key: "landingUrl", label: "Campaign destination (HTTPS)", type: "url" },
    { key: "utmSource", label: "UTM source" },
    { key: "utmMedium", label: "UTM medium" },
    { key: "utmCampaign", label: "UTM campaign" },
    { key: "clicks", label: "Clicks", type: "number" },
    { key: "conversions", label: "Conversions", type: "number" },
    { key: "revenue", label: "Attributed revenue (ZAR)", type: "number" },
    { key: "notes", label: "Campaign notes" },
  ],
};
const copy = {
  orders: [
    "Orders",
    "Keep every order moving, from confirmation to delivery.",
    "Create order",
  ],
  customers: [
    "Customers",
    "Know your audience. Build lasting relationships.",
    "Add customer",
  ],
  inventory: [
    "Inventory",
    "A clear view of your stock, down to the last unit.",
    "Add stock record",
  ],
  campaigns: [
    "Marketing",
    "Track your campaigns and understand what performs.",
    "Create campaign",
  ],
} as const;
export default function CommercePage({ kind }: { kind: CommerceKind }) {
  const query = useCommerce();
  const products = useAdminProducts();
  const save = useSaveCommerce();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CommerceRecord>();
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [notice, setNotice] = useState("");
  const rows = (query.data ?? [])
    .filter((r) => r.kind === kind)
    .filter(
      (r) =>
        (r.id + JSON.stringify(r.data))
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (products.data ?? []).some(
          (p) =>
            p.id === r.data.productId &&
            p.name.toLowerCase().includes(search.toLowerCase()),
        ),
    )
    .filter(
      (r) =>
        filter === "all" ||
        r.data.status === filter ||
        (filter === "low" &&
          availableStock(r.data) <= Number(r.data.threshold)),
    );
  const [title, subtitle, action] = copy[kind];
  const productName = (id: unknown) =>
    products.data?.find((p) => p.id === id)?.name ?? "Unknown product";
  function edit(r?: CommerceRecord) {
    save.reset();
    setEditing(r);
    setForm(
      r
        ? {
            ...r.data,
            ...(kind === "inventory" ? { adjustmentReason: "" } : {}),
          }
        : Object.fromEntries(
            fields[kind].map((f) => [
              f.key,
              f.type === "number"
                ? f.key === "unitCostZar"
                  ? null
                  : f.key === "quantity"
                    ? 1
                    : 0
                : f.type === "checkbox"
                  ? false
                  : (f.options?.[0] ?? ""),
            ]),
          ),
    );
    setOpen(true);
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await save.mutateAsync({
        kind,
        id: editing?.id,
        data: form,
      });
      setNotice(result.emailWarning ?? `${title} saved successfully.`);
      setOpen(false);
    } catch {
      /* mutation renders error */
    }
  }
  const campaigns = (query.data ?? []).filter((r) => r.kind === "campaigns");
  const summary =
    kind === "orders"
      ? [
          ["Orders", rows.length],
          [
            "Awaiting processing",
            rows.filter((r) => r.data.status === "pending").length,
          ],
          [
            "Paid revenue",
            money(
              rows
                .filter(
                  (r) =>
                    r.data.payment === "paid" && r.data.status !== "cancelled",
                )
                .reduce((s, r) => s + Number(r.data.total), 0),
            ),
          ],
        ]
      : kind === "inventory"
        ? [
            ["Products tracked", rows.length],
            [
              "Units on hand",
              rows.reduce((s, r) => s + Number(r.data.quantity), 0),
            ],
            [
              "Low-stock alerts",
              rows.filter(
                (r) => Number(r.data.quantity) <= Number(r.data.threshold),
              ).length,
            ],
          ]
        : kind === "customers"
          ? [
              ["Customers", rows.length],
              [
                "Marketing subscribers",
                rows.filter((r) => r.data.consent).length,
              ],
              [
                "Recorded orders",
                (query.data ?? []).filter((r) => r.kind === "orders").length,
              ],
            ]
          : [
              ["Campaigns", rows.length],
              [
                "Total spend",
                money(campaigns.reduce((s, r) => s + Number(r.data.spend), 0)),
              ],
              [
                "Return on ad spend",
                (() => {
                  const spend = campaigns.reduce(
                    (s, r) => s + Number(r.data.spend),
                    0,
                  );
                  return spend
                    ? (
                        campaigns.reduce(
                          (s, r) => s + Number(r.data.revenue),
                          0,
                        ) / spend
                      ).toFixed(2) + "×"
                    : "—";
                })(),
              ],
            ];
  return (
    <div className="p-5 lg:p-9 space-y-7 max-w-[1600px] mx-auto">
      <header className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
        </div>
        <Button onClick={() => edit()}>
          <Plus size={16} />
          {action}
        </Button>
      </header>
      {notice && (
        <div role="status" className="admin-panel text-sm text-primary">
          {notice}
        </div>
      )}
      {query.error && (
        <div role="alert" className="admin-panel text-red-600">
          {query.error.message}
          <Button onClick={() => void query.refetch()} className="ml-4">
            Retry
          </Button>
        </div>
      )}
      <div className="grid sm:grid-cols-3 gap-5">
        {summary.map(([label, value]) => (
          <section key={String(label)} className="admin-panel">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-3xl font-semibold mt-3">{value}</p>
          </section>
        ))}
      </div>
      <section className="admin-panel !p-0 overflow-hidden">
        <div className="p-5 flex flex-wrap items-center gap-4 justify-between">
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute top-3 left-3 text-muted-foreground"
              size={15}
            />
            <Input
              aria-label={`Search ${title}`}
              placeholder={`Search ${title.toLowerCase()}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {(kind === "orders" ||
            kind === "campaigns" ||
            kind === "inventory") && (
            <select
              aria-label="Filter records"
              className="border p-2 text-xs"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All records</option>
              {(kind === "orders"
                ? ["pending", "processing", "shipped", "delivered", "cancelled"]
                : kind === "inventory"
                  ? ["low"]
                  : ["Draft", "Active", "Completed"]
              ).map((v) => (
                <option key={v} value={v}>
                  {v === "low" ? "Low stock" : v}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                {(kind === "orders"
                  ? [
                      "Order",
                      "Customer",
                      "Product",
                      "Total",
                      "Status",
                      "Payment",
                    ]
                  : kind === "inventory"
                    ? ["Product", "On hand", "Alert threshold", "Availability"]
                    : kind === "customers"
                      ? ["Customer", "Email", "Phone", "Marketing"]
                      : [
                          "Campaign",
                          "Channel",
                          "Status",
                          "Spend",
                          "Revenue",
                          "Conversions",
                        ]
                ).map((h) => (
                  <th key={h}>{h}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  {kind === "orders" ? (
                    <>
                      <td className="text-primary">
                        #{r.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td>{String(r.data.name)}</td>
                      <td>
                        {orderItems(r.data)
                          .map(
                            (i) =>
                              (i.name || productName(i.productId)) +
                              " × " +
                              i.quantity,
                          )
                          .join(", ")}
                      </td>
                      <td>{money(Number(r.data.total))}</td>
                      <td>
                        <Badge variant="secondary">
                          {String(r.data.status)}
                        </Badge>
                      </td>
                      <td>
                        {String(r.data.payment)}
                        {r.data.quoteRequired === true && (
                          <span className="block text-xs text-primary">
                            Quote request
                          </span>
                        )}
                        {r.data.source === "storefront" &&
                          r.data.confirmationEmail !== "sent" &&
                          (r.data.payment === "paid" ||
                            r.data.quoteRequired === true) && (
                            <button
                              type="button"
                              className="block text-xs underline text-primary mt-1"
                              onClick={async () => {
                                try {
                                  await request("/api/payflex", {
                                    method: "POST",
                                    body: { id: r.id },
                                    admin: true,
                                  });
                                  await query.refetch();
                                  setNotice("Confirmation email retried");
                                } catch (e) {
                                  setNotice(
                                    e instanceof Error
                                      ? e.message
                                      : "Email could not be retried",
                                  );
                                }
                              }}
                            >
                              Retry confirmation email
                            </button>
                          )}
                        {r.data.fulfillmentEmail === "failed" && (
                          <button
                            type="button"
                            className="block text-xs text-primary underline mt-1"
                            onClick={async () => {
                              try {
                                const result = await request<{
                                  emailWarning?: string;
                                }>("/api/payflex", {
                                  method: "POST",
                                  body: {
                                    id: r.id,
                                    notification: "fulfillment",
                                  },
                                  admin: true,
                                });
                                await query.refetch();
                                setNotice(
                                  result.emailWarning ?? "Status email sent.",
                                );
                              } catch (e) {
                                setNotice(
                                  e instanceof Error
                                    ? e.message
                                    : "Retry failed",
                                );
                              }
                            }}
                          >
                            Retry status email
                          </button>
                        )}
                        {r.data.paymentProvider === "payflex" && (
                          <button
                            type="button"
                            className="block text-xs underline text-primary mt-1"
                            onClick={async () => {
                              try {
                                await request("/api/payflex", {
                                  method: "POST",
                                  body: { id: r.id },
                                  admin: true,
                                });
                                await query.refetch();
                                setNotice("Payflex status refreshed");
                              } catch (e) {
                                setNotice(
                                  e instanceof Error
                                    ? e.message
                                    : "Payment status could not be checked",
                                );
                              }
                            }}
                          >
                            Refresh Payflex status
                          </button>
                        )}
                      </td>
                    </>
                  ) : kind === "inventory" ? (
                    <>
                      <td>{productName(r.data.productId)}</td>
                      <td>
                        {String(r.data.quantity)}
                        {Number(r.data.reserved ?? 0) > 0 && (
                          <span className="block text-xs text-muted-foreground">
                            {Number(r.data.reserved)} reserved ·{" "}
                            {Number(r.data.quantity) - Number(r.data.reserved)}{" "}
                            available
                          </span>
                        )}
                      </td>
                      <td>{String(r.data.threshold)}</td>
                      <td>
                        <Badge
                          variant={
                            Number(r.data.quantity) <= Number(r.data.threshold)
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {availableStock(r.data) === 0
                            ? "Out of stock"
                            : Number(r.data.quantity) <=
                                Number(r.data.threshold)
                              ? "Low stock"
                              : "In stock"}
                        </Badge>
                      </td>
                    </>
                  ) : kind === "customers" ? (
                    <>
                      <td className="font-medium">{String(r.data.name)}</td>
                      <td>
                        <a
                          href={"mailto:" + r.data.email}
                          className="text-primary"
                        >
                          {String(r.data.email)}
                        </a>
                      </td>
                      <td>{String(r.data.phone) || "—"}</td>
                      <td>
                        {r.data.consent ? "Subscribed" : "Not subscribed"}
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{String(r.data.name)}</td>
                      <td>{String(r.data.channel)}</td>
                      <td>
                        <Badge variant="secondary">
                          {String(r.data.status)}
                        </Badge>
                      </td>
                      <td>{money(Number(r.data.spend))}</td>
                      <td>{money(Number(r.data.revenue))}</td>
                      <td>{String(r.data.conversions)}</td>
                    </>
                  )}
                  <td>
                    {kind === "orders" && <OrderDocument order={r} />}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => edit(r)}
                      aria-label={`Edit ${r.data.name ?? productName(r.data.productId)}`}
                    >
                      <Pencil size={14} />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {query.isPending ? (
          <p className="text-center p-12 text-muted-foreground">Loading…</p>
        ) : (
          rows.length === 0 && (
            <div className="py-16 text-center">
              <Package className="mx-auto size-10 text-muted-foreground mb-4" />
              <h2 className="font-medium">
                {search || filter !== "all"
                  ? "No matching records"
                  : `No ${title.toLowerCase()} yet`}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {search
                  ? "Try another search."
                  : "Add your first record to get started."}
              </p>
              <Button variant="outline" className="mt-5" onClick={() => edit()}>
                <Plus size={14} />
                {action}
              </Button>
            </div>
          )
        )}
      </section>
      {kind === "inventory" && (
        <p className="text-xs text-muted-foreground">
          Stock is deducted automatically when an order moves from processing to
          shipped. Update on-hand quantities for stock receipts, returns, and
          stocktakes.
        </p>
      )}
      {kind === "campaigns" && (
        <p className="text-xs text-muted-foreground">
          Campaign metrics are entered manually from your marketing platforms.
          Revenue attribution is reported separately from order revenue.
        </p>
      )}
      {(kind === "inventory" || kind === "campaigns") && (
        <OperationsInsights kind={kind} rows={rows} productName={productName} />
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="admin-theme max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit record" : action}</DialogTitle>
            <DialogDescription>
              {kind === "orders"
                ? "Order totals are calculated from the current catalogue price. Status changes send a customer email."
                : "Changes are saved to your business database."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            {fields[kind].map((f) => (
              <label key={f.key} className="block text-sm font-medium">
                {f.label}
                {f.type === "checkbox" ? (
                  <input
                    className="ml-3"
                    type="checkbox"
                    checked={Boolean(form[f.key])}
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: e.target.checked })
                    }
                  />
                ) : f.type === "product" ? (
                  <select
                    required
                    className="block w-full border p-2 mt-1"
                    value={String(form[f.key] ?? "")}
                    disabled={
                      !!editing && (kind === "orders" || kind === "inventory")
                    }
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: e.target.value })
                    }
                  >
                    <option value="">Select a product</option>
                    {products.data?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {money(p.priceZar)}
                      </option>
                    ))}
                  </select>
                ) : f.options ? (
                  <select
                    disabled={
                      kind === "orders" &&
                      editing?.data.paymentProvider === "payflex" &&
                      ["payment", "documentPaymentMethod"].includes(f.key)
                    }
                    className="block w-full border p-2 mt-1"
                    value={String(form[f.key] ?? "")}
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: e.target.value })
                    }
                  >
                    {f.options.map((o) => (
                      <option key={o} value={o}>
                        {f.key === "documentPaymentMethod"
                          ? ({
                              none: "No offline payment instructions",
                              "bank-transfer": "Bank transfer",
                              cash: "Cash",
                              "bank-transfer-or-cash": "Bank transfer or cash",
                            }[o] ?? o)
                          : o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    readOnly={
                      !!editing &&
                      kind === "orders" &&
                      editing.data.source === "storefront" &&
                      ["name", "email", "address"].includes(f.key)
                    }
                    className="mt-1"
                    required={f.required}
                    type={f.type ?? "text"}
                    min={f.key === "quantity" && kind === "orders" ? 1 : 0}
                    step={
                      f.type === "number"
                        ? [
                            "budget",
                            "spend",
                            "revenue",
                            "unitCostZar",
                          ].includes(f.key)
                          ? "0.01"
                          : 1
                        : undefined
                    }
                    value={String(form[f.key] ?? "")}
                    disabled={
                      !!editing && kind === "orders" && f.key === "quantity"
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [f.key]:
                          f.type === "number"
                            ? f.key === "unitCostZar" && e.target.value === ""
                              ? null
                              : Number(e.target.value)
                            : e.target.value,
                      })
                    }
                  />
                )}
              </label>
            ))}
            {kind === "orders" && editing?.data.quoteRequired === true && (
              <label className="block text-sm">
                Agreed goods subtotal (ZAR, optional)
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={String(form.goodsQuoteZar ?? "")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      goodsQuoteZar:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </label>
            )}
            {kind === "orders" && editing?.data.quoteRequired === true && (
              <label className="block text-sm">
                Agreed delivery charge (ZAR)
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={String(form.deliveryQuoteZar ?? "")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      deliveryQuoteZar:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
                <span className="text-xs text-muted-foreground">
                  Confirm this with the customer before recording payment.
                </span>
              </label>
            )}
            {kind === "orders" &&
              editing?.data.paymentProvider === "payflex" &&
              !editing.data.payflexOrderId && (
                <div className="border p-4 space-y-3">
                  <label className="block text-sm">
                    Payflex order ID for reconciliation
                    <Input
                      value={String(form.providerOrderId ?? "")}
                      onChange={(e) =>
                        setForm({ ...form, providerOrderId: e.target.value })
                      }
                    />
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await request("/api/payflex", {
                          method: "POST",
                          body: {
                            id: editing.id,
                            providerOrderId: form.providerOrderId,
                          },
                          admin: true,
                        });
                        await query.refetch();
                        setNotice("Payment reconciled with Payflex");
                        setOpen(false);
                      } catch (e) {
                        setNotice(
                          e instanceof Error
                            ? e.message
                            : "Reconciliation failed",
                        );
                      }
                    }}
                  >
                    Verify with Payflex
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Use the order ID from your Payflex merchant portal. The
                    server verifies the reference and amount before making any
                    change.
                  </p>
                </div>
              )}
            {kind === "inventory" &&
              editing &&
              Array.isArray(editing.data.movements) && (
                <section className="border-t pt-4">
                  <h3 className="text-sm font-semibold mb-3">
                    Recent stock movements
                  </h3>
                  <ol className="space-y-2 text-xs">
                    {(
                      editing.data.movements as {
                        at: string;
                        delta: number;
                        reason: string;
                        balance: number;
                        type?: string;
                      }[]
                    )
                      .slice(-10)
                      .reverse()
                      .map((m, i) => (
                        <li key={i} className="border-b pb-2">
                          {new Date(m.at).toLocaleString("en-ZA", {
                            timeZone: "Africa/Johannesburg",
                          })}{" "}
                          · {m.delta > 0 ? "+" : ""}
                          {m.delta} · {m.reason} · Balance {m.balance}
                        </li>
                      ))}
                  </ol>
                </section>
              )}
            {kind === "orders" && editing && (
              <section className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3">
                  Fulfillment history
                </h3>
                <ol className="space-y-2 text-xs">
                  {fulfillmentEvents(editing.data.fulfillmentEvents).map(
                    (e, i) => (
                      <li key={i} className="capitalize">
                        {e.status} ·{" "}
                        {new Date(e.at).toLocaleString("en-ZA", {
                          timeZone: "Africa/Johannesburg",
                        })}
                      </li>
                    ),
                  )}
                </ol>
              </section>
            )}
            {save.error && (
              <p role="alert" className="text-red-600 text-sm">
                {save.error.message}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
