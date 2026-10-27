import { CheckCircle2, Circle, Truck, ExternalLink } from "lucide-react";
import {
  fulfillmentEvents,
  safeTrackingUrl,
} from "../../../db/store-operations";
type Props = {
  status: string;
  courier?: string;
  tracking?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  fulfillmentEvents?: unknown;
};
export default function OrderProgress({
  status,
  courier,
  tracking,
  trackingUrl,
  estimatedDelivery,
  fulfillmentEvents: history,
}: Props) {
  const events = fulfillmentEvents(history),
    steps = ["pending", "processing", "shipped", "delivered"],
    current = steps.indexOf(status),
    url = safeTrackingUrl(trackingUrl);
  return (
    <section className="border p-6 space-y-6" aria-label="Order fulfillment">
      <div className="flex items-center gap-3">
        <Truck className="text-primary" />
        <h2 className="font-serif text-2xl uppercase font-bold">
          {status === "cancelled" ? "Order cancelled" : "Track your order"}
        </h2>
      </div>
      {status !== "cancelled" && (
        <ol className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {steps.map((step, i) => (
            <li key={step} className="space-y-2">
              {i <= current ? (
                <CheckCircle2 className="text-primary" />
              ) : (
                <Circle className="text-muted-foreground" />
              )}
              <p
                className="capitalize text-sm font-semibold"
                aria-current={i === current ? "step" : undefined}
              >
                {step === "pending" ? "Order received" : step}
              </p>
              <p className="text-xs text-muted-foreground">
                {events.find((e) => e.status === step)
                  ? new Date(
                      events.find((e) => e.status === step)!.at,
                    ).toLocaleString("en-ZA", {
                      timeZone: "Africa/Johannesburg",
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : i <= current
                    ? "Confirmed"
                    : "Awaiting update"}
              </p>
            </li>
          ))}
        </ol>
      )}
      <dl className="text-sm space-y-3">
        {courier && (
          <div>
            <dt className="text-muted-foreground">Courier</dt>
            <dd>{courier}</dd>
          </div>
        )}
        {tracking && (
          <div>
            <dt className="text-muted-foreground">Tracking reference</dt>
            <dd className="break-all">{tracking}</dd>
          </div>
        )}
        {estimatedDelivery && (
          <div>
            <dt className="text-muted-foreground">Estimated delivery</dt>
            <dd>
              {new Date(
                estimatedDelivery + "T12:00:00+02:00",
              ).toLocaleDateString("en-ZA", {
                dateStyle: "long",
                timeZone: "Africa/Johannesburg",
              })}
            </dd>
            <p className="text-xs text-muted-foreground">
              Subject to courier updates.
            </p>
          </div>
        )}
      </dl>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline inline-flex gap-2 items-center text-sm"
        >
          Track with courier
          <ExternalLink size={14} />
        </a>
      ) : status === "shipped" && !tracking ? (
        <p className="text-sm text-muted-foreground">
          Your shipment details will appear here when the store adds them.
        </p>
      ) : null}
    </section>
  );
}
