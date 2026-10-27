import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { request } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { CommerceRecord } from "../../../db/commerce-validation";
import { money } from "@/hooks/use-commerce";
export default function CustomerAccount() {
  const navigate = useNavigate();
  const q = useQuery({
    queryKey: ["account"],
    queryFn: () =>
      request<{
        user: { name: string; email: string; role: string };
        orders: CommerceRecord[];
      }>("/api/account"),
    retry: false,
  });
  return (
    <main className="admin-theme min-h-screen bg-muted p-8">
      <div className="max-w-3xl mx-auto admin-panel space-y-5">
        <Link to="/" className="font-bold text-2xl">
          <img
            src="/brand/hawk-black.png"
            alt="Hawk Pro Audio"
            width={2000}
            height={1250}
            className="h-16 w-auto object-contain"
          />
        </Link>
        <h1 className="text-2xl font-semibold">Your account</h1>
        {q.isPending ? (
          <p>Loading…</p>
        ) : q.error ? (
          <>
            <p>Please sign in to access your account.</p>
            <Button asChild>
              <Link to="/account/login">Sign in</Link>
            </Button>
          </>
        ) : (
          <>
            <p>Welcome, {q.data?.user.name}.</p>
            <p className="text-muted-foreground">{q.data?.user.email}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/shop">Explore the catalogue</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/account/reset-password">Password & security</Link>
              </Button>
              <Button
                variant="ghost"
                onClick={async () => {
                  await request("/api/account", {
                    method: "POST",
                    body: { action: "logout" },
                  });
                  await q.refetch();
                  navigate("/account/login");
                }}
              >
                Sign out
              </Button>
            </div>
            <h2 className="text-xl font-semibold pt-6">Your orders</h2>
            {q.data?.orders.length ? (
              q.data.orders.map((o) => (
                <article
                  key={o.id}
                  className="border rounded-lg p-4 flex flex-wrap justify-between gap-4"
                >
                  <div>
                    <p className="font-semibold">
                      #{o.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {String(o.data.productName)} × {String(o.data.quantity)}
                    </p>
                    {Boolean(o.data.tracking) && (
                      <p className="text-xs mt-2">
                        Tracking: {String(o.data.tracking)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p>{money(Number(o.data.total))}</p>
                    <p className="capitalize text-sm text-primary mt-1">
                      {String(o.data.status)}
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No orders yet. Orders placed with your account email will appear
                here.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
