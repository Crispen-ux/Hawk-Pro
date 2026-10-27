import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Download, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCommerce, useSaveCommerce, money } from "@/hooks/use-commerce";
import {
  customerProfiles,
  type CustomerProfile,
} from "../../../../db/store-operations";
import { downloadCsv } from "@/lib/export-csv";
export default function CustomersPage() {
  const q = useCommerce(),
    save = useSaveCommerce();
  const [search, setSearch] = useState(""),
    [segment, setSegment] = useState("all"),
    [editing, setEditing] = useState<CustomerProfile | null>(null),
    [notice, setNotice] = useState("");
  const profiles = customerProfiles(q.data ?? []),
    rows = profiles.filter(
      (p) =>
        (p.name + " " + p.email + " " + p.phone)
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (segment === "all" ||
          (segment === "subscribers" ? p.consent : p.segment === segment)),
    );
  const blank: CustomerProfile = {
    name: "",
    email: "",
    phone: "",
    notes: "",
    consent: false,
    orders: [],
    spent: 0,
    paidOrders: 0,
    lastOrder: "",
    segment: "Prospect",
  };
  function edit(p: CustomerProfile) {
    save.reset();
    setEditing({ ...p });
  }
  return (
    <div className="p-5 lg:p-9 max-w-[1600px] mx-auto space-y-7">
      <header className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Customers & engagement</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Guest shoppers and customer records, with their complete order
            history.
          </p>
        </div>
        <Button onClick={() => edit(blank)}>
          <Plus size={16} />
          Add customer
        </Button>
      </header>
      {notice && (
        <p role="status" className="admin-panel">
          {notice}
        </p>
      )}
      {q.error && (
        <div role="alert" className="admin-panel">
          {q.error.message}
          <Button onClick={() => void q.refetch()}>Retry</Button>
        </div>
      )}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          ["Customers", profiles.length],
          [
            "Returning customers",
            profiles.filter((p) => p.paidOrders > 1).length,
          ],
          ["Marketing subscribers", profiles.filter((p) => p.consent).length],
        ].map(([label, value]) => (
          <div key={label} className="admin-panel">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-semibold mt-2">{value}</p>
          </div>
        ))}
      </div>
      <section className="admin-panel !p-0 overflow-hidden">
        <div className="p-5 flex flex-wrap gap-3">
          <label className="flex items-center gap-2 flex-1 min-w-48">
            <Search size={16} />
            <Input
              aria-label="Search customers"
              placeholder="Name, email or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            aria-label="Customer segment"
            className="border p-2 bg-card"
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
          >
            {[
              "all",
              "subscribers",
              "Returning",
              "First purchase",
              "Enquiry / unpaid",
              "Prospect",
            ].map((v) => (
              <option key={v} value={v}>
                {v === "all"
                  ? "All customers"
                  : v === "subscribers"
                    ? "Marketing subscribers"
                    : v}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            disabled={!rows.length}
            onClick={() =>
              downloadCsv("hawk-customers.csv", [
                [
                  "Name",
                  "Email",
                  "Phone",
                  "Segment",
                  "Orders",
                  "Lifetime paid ZAR",
                  "Marketing consent",
                  "Last order",
                ],
                ...rows.map((p) => [
                  p.name,
                  p.email,
                  p.phone,
                  p.segment,
                  p.orders.length,
                  p.spent.toFixed(2),
                  p.consent ? "Yes" : "No",
                  p.lastOrder,
                ]),
              ])
            }
          >
            <Download size={16} />
            Export filtered customers
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                {[
                  "Customer",
                  "Segment",
                  "Orders",
                  "Lifetime paid",
                  "Marketing",
                  "",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.email}>
                  <td>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </td>
                  <td>{p.segment}</td>
                  <td>{p.orders.length}</td>
                  <td>{money(p.spent)}</td>
                  <td>{p.consent ? "Subscribed" : "Not subscribed"}</td>
                  <td>
                    <Button variant="ghost" onClick={() => edit(p)}>
                      View customer
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {q.isPending ? (
          <p role="status" className="p-10">
            Loading customers…
          </p>
        ) : !rows.length ? (
          <div className="p-12 text-center">
            <Users className="mx-auto mb-3" />
            <p>No customers match this view.</p>
          </div>
        ) : null}
      </section>
      <p className="text-xs text-muted-foreground">
        Order confirmation consent is separate from marketing consent. A saved
        customer preference takes precedence over earlier checkout opt-ins.
        Export subscribers only for marketing campaigns.
      </p>
      <Dialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="admin-theme bg-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.name || "New customer"}</DialogTitle>
            <DialogDescription>
              Manage contact details, marketing preference and order history.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await save.mutateAsync({
                    kind: "customers",
                    id: editing.id,
                    data: {
                      name: editing.name,
                      email: editing.email,
                      phone: editing.phone,
                      notes: editing.notes,
                      consent: editing.consent,
                    },
                  });
                  setNotice("Customer preferences saved.");
                  setEditing(null);
                } catch {}
              }}
            >
              {(["name", "email", "phone"] as const).map((k) => (
                <label key={k} className="block text-sm capitalize">
                  {k}
                  <Input
                    required={k !== "phone"}
                    type={k === "email" ? "email" : "text"}
                    value={editing[k]}
                    onChange={(e) =>
                      setEditing({ ...editing, [k]: e.target.value })
                    }
                  />
                </label>
              ))}
              <label className="block text-sm">
                Internal notes
                <Textarea
                  value={editing.notes}
                  onChange={(e) =>
                    setEditing({ ...editing, notes: e.target.value })
                  }
                />
              </label>
              <label className="flex gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={editing.consent}
                  onChange={(e) =>
                    setEditing({ ...editing, consent: e.target.checked })
                  }
                />
                Customer explicitly agreed to marketing emails
              </label>
              {editing.orders.length > 0 && (
                <section className="border-t pt-4 space-y-3">
                  <h3 className="font-semibold">
                    Order history · {money(editing.spent)} paid
                  </h3>
                  {editing.orders.map((o) => (
                    <div
                      key={o.id}
                      className="border p-3 text-sm flex flex-wrap justify-between gap-2"
                    >
                      <div>
                        <Link
                          className="text-primary underline"
                          to={"/admin/orders?search=" + o.id}
                        >
                          #{o.id.slice(0, 8).toUpperCase()}
                        </Link>
                        <p className="text-xs">
                          {new Date(o.createdAt).toLocaleDateString("en-ZA", {
                            timeZone: "Africa/Johannesburg",
                          })}
                        </p>
                      </div>
                      <div>
                        {money(Number(o.data.total))}
                        <p className="capitalize text-xs">
                          {String(o.data.status)} · {String(o.data.payment)}
                        </p>
                      </div>
                    </div>
                  ))}
                </section>
              )}
              {save.error && (
                <p role="alert" className="text-red-600">
                  {save.error.message}
                </p>
              )}
              <Button disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save customer"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
