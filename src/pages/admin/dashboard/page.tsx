import { orderItems } from "../../../../db/checkout-model";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Wallet,
  Users,
  Package,
  ArrowUpRight,
  ArrowRight,
  Download,
  TriangleAlert,
  ChartNoAxesCombined,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
import { Button } from "@/components/ui/button";
import { useCommerce, useAdminProducts, money } from "@/hooks/use-commerce";
import { Badge } from "@/components/ui/badge";
export default function AdminDashboard({
  reports = false,
}: {
  reports?: boolean;
}) {
  const records = useCommerce();
  const products = useAdminProducts();
  const [days, setDays] = useState(30);
  const orders = (records.data ?? []).filter((r) => r.kind === "orders");
  const selected = orders.filter(
    (r) => new Date(r.createdAt).getTime() >= Date.now() - days * 86400000,
  );
  const paid = selected.filter(
    (r) => r.data.payment === "paid" && r.data.status !== "cancelled",
  );
  const revenue = paid.reduce((s, r) => s + Number(r.data.total), 0);
  const customers = (records.data ?? []).filter((r) => r.kind === "customers");
  const stock = (records.data ?? []).filter((r) => r.kind === "inventory");
  const low = stock.filter(
    (r) => Number(r.data.quantity) <= Number(r.data.threshold),
  );
  const chart = Array.from({ length: 7 }, (_, i) => {
    const start = new Date(Date.now() - (((7 - i) * days) / 7) * 86400000);
    const end = new Date(start.getTime() + (days / 7) * 86400000);
    const bucket = paid.filter(
      (r) => new Date(r.createdAt) >= start && new Date(r.createdAt) < end,
    );
    return {
      name: start.toLocaleDateString("en-ZA", {
        month: "short",
        day: "numeric",
      }),
      revenue: bucket.reduce((s, r) => s + Number(r.data.total), 0),
      orders: bucket.length,
    };
  });
  const top = (products.data ?? [])
    .map((p) => ({
      ...p,
      sales: paid
        .flatMap((o) => orderItems(o.data))
        .filter((i) => i.productId === p.id)
        .reduce((s, i) => s + i.quantity, 0),
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 4);
  const error = records.error || products.error;
  function exportReport() {
    const rows = [
      ["Order", "Created", "Status", "Payment", "Total ZAR"],
      ...selected.map((r) => [
        r.id,
        r.createdAt,
        String(r.data.status),
        String(r.data.payment),
        String(r.data.total),
      ]),
    ];
    const blob = new Blob(
      [
        rows
          .map((r) => r.map((v) => '"' + v.replace(/"/g, '""') + '"').join(","))
          .join("\n"),
      ],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hawk-sales.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="p-5 lg:p-9 space-y-7 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap justify-between gap-4 items-center">
        <div>
          <p className="text-xs text-muted-foreground mb-1">
            Your business at a glance
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {reports ? "Reports & insights" : "Business overview"}
          </h1>
        </div>
        <div className="flex gap-3">
          <select
            aria-label="Reporting period"
            className="border bg-card px-3 text-xs"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last 12 months</option>
          </select>
          <Button variant="outline" onClick={exportReport}>
            <Download size={15} />
            Export report
          </Button>
        </div>
      </div>
      {error && (
        <div role="alert" className="admin-panel text-red-600">
          {error.message}
          <Button
            className="ml-4"
            onClick={() => {
              void records.refetch();
              void products.refetch();
            }}
          >
            Retry
          </Button>
        </div>
      )}
      {records.isPending && <p role="status">Loading business data…</p>}
      <div className="grid xl:grid-cols-[1fr_1.3fr] gap-6">
        <div className="space-y-5">
          <section className="admin-brand-panel p-7 relative overflow-hidden min-h-44">
            <div className="relative z-10 max-w-[75%]">
              <Badge className="bg-card text-primary border-0 mb-3 text-[10px]">
                LET’S MAKE SOME NOISE
              </Badge>
              <h2 className="text-xl font-semibold">
                Good things are taking shape.
              </h2>
              <p className="text-sm text-white/70 mt-2 mb-5">
                Your next great customer experience starts here.
              </p>
              <Link
                to="/admin/orders"
                className="text-xs text-primary font-semibold flex gap-2 items-center"
              >
                Manage your orders <ArrowRight size={14} />
              </Link>
            </div>
            <ChartNoAxesCombined className="absolute right-7 bottom-8 text-primary size-24 opacity-75" />
          </section>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                label: "Total revenue",
                value: money(revenue),
                hint: "Paid, non-cancelled orders",
                icon: Wallet,
                color: "text-primary bg-primary/10",
              },
              {
                label: "Total orders",
                value: selected.length,
                hint: `${selected.filter((o) => o.data.status === "pending").length} awaiting processing`,
                icon: ShoppingBag,
                color: "text-primary bg-primary/10",
              },
              {
                label: "Customers",
                value: customers.length,
                hint: "Customer directory",
                icon: Users,
                color: "text-foreground bg-muted",
              },
              {
                label: "Products",
                value: products.data?.length ?? 0,
                hint: `${products.data?.filter((p) => p.published).length ?? 0} published in your store`,
                icon: Package,
                color: "text-primary bg-primary/10",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="admin-panel flex gap-4 items-start !p-5"
              >
                <div className={`p-3 rounded-lg ${s.color}`}>
                  <s.icon size={20} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-semibold my-2">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.hint}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <section className="admin-panel flex flex-col">
          <div className="flex justify-between">
            <div>
              <h2 className="font-semibold text-sm">Sales performance</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Revenue across your selected period
              </p>
            </div>
            <span className="text-xs text-primary flex gap-1 items-center self-start">
              <span className="size-2 rounded-full bg-primary" />
              Revenue
            </span>
          </div>
          <div className="h-72 mt-8 flex-1 min-h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 4"
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                />
                <Tooltip formatter={(v) => money(Number(v))} />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="var(--primary)"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {paid.length === 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Recorded paid orders will populate this chart.
            </p>
          )}
        </section>
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <section className="admin-panel">
          <div className="flex justify-between mb-5">
            <h2 className="text-sm font-semibold">Fulfillment snapshot</h2>
            <ShoppingBag size={17} className="text-muted-foreground" />
          </div>
          <div className="text-4xl font-semibold mt-6">
            {selected.length
              ? Math.round(
                  (selected.filter((o) => o.data.status === "delivered")
                    .length /
                    selected.length) *
                    100,
                )
              : 0}
            <span className="text-lg text-muted-foreground">%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Orders delivered this period
          </p>
          <div className="h-2 rounded-full bg-muted my-5">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: `${selected.length ? (selected.filter((o) => o.data.status === "delivered").length / selected.length) * 100 : 0}%`,
              }}
            />
          </div>
          {["pending", "processing", "shipped", "delivered"].map((s) => (
            <div key={s} className="flex justify-between text-xs py-2">
              <span className="capitalize text-muted-foreground">{s}</span>
              <span>{selected.filter((o) => o.data.status === s).length}</span>
            </div>
          ))}
        </section>
        <section className="admin-panel">
          <h2 className="text-sm font-semibold mb-5">Top products</h2>
          {top.length ? (
            top.map((p, i) => (
              <Link
                to={"/admin/products/" + p.id}
                key={p.id}
                className="flex gap-3 items-center py-4 border-b last:border-0"
              >
                <div className="size-10 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {p.images[0] ? (
                    <img
                      src={p.images[0]}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <Package className="text-muted-foreground" size={18} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {p.category}
                  </p>
                </div>
                <span className="text-xs">{p.sales} sold</span>
                <span className="text-[10px] text-muted-foreground">
                  0{i + 1}
                </span>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground py-10">
              Add products to start building your catalogue.
            </p>
          )}
        </section>
        <section className="admin-panel">
          <h2 className="text-sm font-semibold mb-5">Needs your attention</h2>
          <div className="bg-amber-50 rounded-lg p-4 flex gap-3">
            <TriangleAlert className="text-amber-500 shrink-0" size={19} />
            <div>
              <p className="text-sm font-medium">
                {low.length} low-stock products
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Keep your best sound in stock.
              </p>
            </div>
          </div>
          <Link
            to="/admin/inventory"
            className="flex justify-between py-5 text-xs text-primary"
          >
            Review inventory
            <ArrowUpRight size={16} />
          </Link>
          <div className="border-t pt-5">
            <p className="text-xs text-muted-foreground mb-2">
              Average order value
            </p>
            <p className="text-2xl font-semibold">
              {money(paid.length ? revenue / paid.length : 0)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-2">
              Based on paid orders in this period
            </p>
          </div>
        </section>
      </div>
      <section className="admin-panel !p-0 overflow-hidden">
        <div className="p-6 flex justify-between">
          <h2 className="text-sm font-semibold">Recent orders</h2>
          <Link to="/admin/orders" className="text-xs text-primary">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                {[
                  "Order",
                  "Customer",
                  "Date",
                  "Status",
                  "Payment",
                  "Total",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {selected.slice(0, 5).map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link to="/admin/orders" className="text-primary">
                      #{o.id.slice(0, 8).toUpperCase()}
                    </Link>
                  </td>
                  <td>{String(o.data.name)}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString("en-ZA")}</td>
                  <td>
                    <Badge variant="secondary">{String(o.data.status)}</Badge>
                  </td>
                  <td>{String(o.data.payment)}</td>
                  <td>{money(Number(o.data.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selected.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-12">
            Your orders will appear here.{" "}
            <Link to="/admin/orders" className="text-primary">
              Create your first order →
            </Link>
          </p>
        )}
      </section>
      {reports && (
        <section className="admin-panel">
          <h2 className="text-sm font-semibold mb-6">Revenue trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area
                  dataKey="revenue"
                  stroke="var(--primary)"
                  fill="var(--accent)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}
