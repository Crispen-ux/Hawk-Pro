import {
  getCheckoutAttempt,
  clearCheckoutAttempt,
} from "@/lib/checkout-attempt";
import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, Package, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useSiteSettings } from "@/hooks/use-settings";
import { request } from "@/lib/api";
import { formatZar } from "@/lib/format";
import type { OrderItem } from "../../../db/checkout-model";
type Receipt = {
  id: string;
  reference: string;
  items: OrderItem[];
  subtotalCents: number;
  shippingCents: number | null;
  totalCents: number | null;
  payment: string;
  paymentState: string;
  status: string;
  quoteRequired: boolean;
  priceOnRequest?: boolean;
  quoteAdjusted?: boolean;
};
export default function CheckoutReturn() {
  const { orderId = "", access = "" } = useParams();
  const { settings } = useSiteSettings();
  const cart = useCart();
  const attempts = useRef(0),
    applied = useRef(false);
  const query = useQuery({
    queryKey: ["guest-order", orderId, access],
    enabled: !!orderId && !!access,
    queryFn: async () => {
      attempts.current++;
      return request<{
        receipt: Receipt;
        emailWarning?: string;
        resumeUrl?: string | null;
      }>(
        "/api/payflex?order=" +
          encodeURIComponent(orderId) +
          "&access=" +
          encodeURIComponent(access),
      );
    },
    retry: false,
    refetchInterval: (q) => {
      const r = q.state.data?.receipt;
      return attempts.current >= 12 ||
        r?.payment === "paid" ||
        r?.quoteRequired ||
        ["declined", "abandoned", "setup-failed"].includes(
          r?.paymentState ?? "",
        )
        ? false
        : 5000;
    },
  });
  const receipt = query.data?.receipt;
  const paid = receipt?.payment === "paid";
  const quoted =
    receipt?.quoteRequired === true && receipt.status !== "cancelled";
  const failed =
    receipt &&
    (["declined", "abandoned", "setup-failed"].includes(receipt.paymentState) ||
      receipt.status === "cancelled");
  useEffect(() => {
    if (!paid || !receipt || applied.current) return;
    applied.current = true;
    const key = "hawk-purchased-" + receipt.id;
    try {
      const currentAttempt = getCheckoutAttempt();
      if (currentAttempt?.key !== receipt.id) return;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* In-memory ref still prevents duplicate application in this page. */
    }
    clearCheckoutAttempt(receipt.id);
    cart.removePurchased(
      receipt.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    );
  }, [paid, receipt, cart]);
  useEffect(() => {
    if (receipt && (quoted || failed)) clearCheckoutAttempt(receipt.id);
  }, [receipt, quoted, failed]);
  return (
    <div className="max-w-3xl mx-auto px-5 py-16 space-y-8">
      <meta name="referrer" content="no-referrer" />
      <header className="text-center space-y-5">
        {paid || quoted ? (
          <CheckCircle2 className="mx-auto size-14 text-primary" />
        ) : failed ? (
          <TriangleAlert className="mx-auto size-14 text-primary" />
        ) : (
          <Clock className="mx-auto size-14 text-primary" />
        )}
        <p className="text-xs uppercase tracking-[.3em] text-primary">
          HAWK / {quoted ? "Quote request" : "Order status"}
        </p>
        <h1 className="font-serif text-5xl uppercase font-extrabold">
          {paid
            ? "Your sound is on its way."
            : quoted
              ? "Your request is with us."
              : failed
                ? receipt?.quoteRequired
                  ? "Quote request cancelled"
                  : "Payment not completed"
                : query.error
                  ? "We are checking your order."
                  : "Checking your payment…"}
        </h1>
        <p className="text-muted-foreground">
          {paid
            ? "Your payment has been verified. We will email your confirmation and delivery updates."
            : quoted
              ? "No payment has been taken. Our team will confirm availability, delivery costs and payment arrangements."
              : failed
                ? "This payment was not completed. No paid order has been confirmed. Your cart is still available."
                : "We confirm payment directly with Payflex. A browser redirect alone never marks an order paid."}
        </p>
      </header>
      {query.error && (
        <div className="border p-5 space-y-3" role="alert">
          <p>{query.error.message}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Check status again
          </Button>
        </div>
      )}
      {(!orderId || !access) && (
        <p className="border p-5">
          Open the order link from your confirmation email, or contact the store
          for assistance.
        </p>
      )}
      {receipt && (
        <section className="border p-6 space-y-5">
          <div className="flex flex-wrap justify-between items-center gap-4 border-b pb-4">
            <h2 className="font-serif text-2xl uppercase font-bold">
              {receipt.reference}
            </h2>
            <span className="text-sm capitalize">
              {paid
                ? "Payment verified"
                : quoted
                  ? "Quote requested"
                  : receipt.paymentState.replaceAll("-", " ")}
            </span>
          </div>
          {receipt.items.map((item) => (
            <div
              key={item.productId}
              className="flex justify-between gap-4 text-sm"
            >
              <span>
                {item.name} × {item.quantity}
                {item.packLabel && (
                  <span className="block text-xs text-muted-foreground">
                    {item.packLabel}
                  </span>
                )}
              </span>
              <span>
                {receipt.quoteAdjusted
                  ? "Agreed quote"
                  : item.unitPriceCents <= 0
                    ? "To be quoted"
                    : formatZar(item.lineTotalCents / 100)}
              </span>
            </div>
          ))}
          <dl className="border-t pt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt>
                {receipt.priceOnRequest && quoted
                  ? "Known item prices"
                  : "Items subtotal"}
              </dt>
              <dd>{formatZar(receipt.subtotalCents / 100)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Delivery / collection</dt>
              <dd>
                {receipt.shippingCents === null
                  ? "To be quoted"
                  : formatZar(receipt.shippingCents / 100)}
              </dd>
            </div>
            {!receipt.quoteRequired && receipt.totalCents !== null && (
              <div className="flex justify-between text-xl font-semibold">
                <dt>Total</dt>
                <dd>{formatZar(receipt.totalCents / 100)}</dd>
              </div>
            )}
          </dl>
          {query.data?.emailWarning && (
            <p className="text-sm text-muted-foreground">
              {query.data.emailWarning}
            </p>
          )}
        </section>
      )}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button asChild>
          <Link to="/shop">
            <Package size={16} />
            Continue shopping
          </Link>
        </Button>
        {paid && (
          <Button variant="outline" asChild>
            <Link to="/account/signup">
              Create an account to track your orders
            </Link>
          </Button>
        )}
        {failed && (
          <Button variant="outline" asChild>
            <Link
              to="/checkout"
              onClick={() => {
                try {
                  clearCheckoutAttempt(orderId);
                } catch {}
              }}
            >
              Return to checkout
            </Link>
          </Button>
        )}
        {query.data?.resumeUrl && !paid && !failed && (
          <Button
            variant="outline"
            onClick={() => {
              const url = new URL(query.data!.resumeUrl!);
              if (
                url.protocol === "https:" &&
                url.hostname.endsWith(".payflex.co.za")
              )
                window.location.assign(url.toString());
            }}
          >
            Resume Payflex checkout
          </Button>
        )}
        {receipt && !paid && !quoted && !failed && (
          <Button variant="outline" onClick={() => void query.refetch()}>
            Refresh payment status
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground text-center">
        Need help?{" "}
        <a className="text-primary" href={"mailto:" + settings.contact.email}>
          {settings.contact.email}
        </a>
        {receipt ? " · Quote " + receipt.reference : ""}
      </p>
    </div>
  );
}
