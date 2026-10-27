import { Truck, MapPin, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSiteSettings } from "@/hooks/use-settings";
import {
  SADC_COUNTRIES,
  type EstimateInput,
} from "../../../db/sales-validation";
import type { DeliveryQuote } from "../../../db/checkout-model";
import { formatZar } from "@/lib/format";
export default function DeliveryEstimator({
  destination,
  onChange,
  quote,
  busy,
  error,
  onEstimate,
}: {
  destination: EstimateInput["destination"];
  onChange: (value: EstimateInput["destination"]) => void;
  quote: DeliveryQuote | null;
  busy: boolean;
  error: string;
  onEstimate: () => void;
}) {
  const { settings } = useSiteSettings();
  return (
    <section className="border p-5 space-y-4">
      <h2 className="font-serif text-xl font-bold uppercase flex gap-2 items-center">
        <Truck className="size-5 text-primary" />
        Delivery & collection
      </h2>
      <p className="text-sm text-muted-foreground">
        Estimate delivery before paying. All prices are in South African rand.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="text-sm space-y-2">
          Destination country
          <select
            aria-label="Destination country"
            className="w-full border bg-background p-2"
            value={destination.country}
            onChange={(e) =>
              onChange({ ...destination, country: e.target.value })
            }
          >
            {SADC_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm space-y-2">
          Postcode / postal code
          <Input
            aria-label="Postcode / postal code"
            value={destination.postcode}
            maxLength={16}
            placeholder={
              destination.country === "ZA"
                ? "e.g. 2000"
                : "Your postal code, if applicable"
            }
            onChange={(e) =>
              onChange({ ...destination, postcode: e.target.value })
            }
          />
        </label>
      </div>
      {settings.sales.collectionEnabled && (
        <div className="flex flex-wrap gap-5 text-sm">
          <label className="flex gap-2 items-center">
            <input
              type="radio"
              name="delivery-method"
              checked={destination.method === "delivery"}
              onChange={() => onChange({ ...destination, method: "delivery" })}
            />
            Deliver to my address
          </label>
          <label className="flex gap-2 items-center">
            <input
              type="radio"
              name="delivery-method"
              checked={destination.method === "collection"}
              onChange={() =>
                onChange({ ...destination, method: "collection" })
              }
            />
            Collect from store
          </label>
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={onEstimate}
      >
        <MapPin size={15} />
        {busy ? "Calculating…" : "Calculate delivery"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {quote && (
        <div className="border-t pt-4 space-y-2 text-sm" role="status">
          <div className="flex justify-between gap-3 font-semibold">
            <span>
              {destination.method === "collection"
                ? "Collection"
                : "Estimated shipping"}
            </span>
            <span>
              {quote.shippingCents === null
                ? "Quote required"
                : quote.shippingCents === 0
                  ? "Free"
                  : formatZar(quote.shippingCents / 100)}
            </span>
          </div>
          <p className="text-muted-foreground">{quote.message}</p>
          {quote.arrivalMin && quote.arrivalMax && (
            <p className="flex gap-2">
              <PackageCheck className="size-4 text-primary shrink-0" />
              Estimated{" "}
              {destination.method === "collection"
                ? "ready date"
                : "arrival"}:{" "}
              {new Date(quote.arrivalMin + "T12:00:00Z").toLocaleDateString(
                "en-ZA",
                { day: "numeric", month: "short" },
              )}
              –
              {new Date(quote.arrivalMax + "T12:00:00Z").toLocaleDateString(
                "en-ZA",
                { day: "numeric", month: "short" },
              )}
            </p>
          )}
          {quote.transitMinDays !== null &&
            destination.method === "delivery" && (
              <p className="text-xs text-muted-foreground">
                Transit: {quote.transitMinDays}–{quote.transitMaxDays} working
                days after dispatch. Estimates exclude weekends; public holidays
                and customs may add time.
              </p>
            )}
          {quote.notes && (
            <p className="text-xs text-muted-foreground whitespace-pre-line">
              {quote.notes}
            </p>
          )}
          {destination.method === "collection" && (
            <p className="text-muted-foreground whitespace-pre-line">
              Collect from: {settings.contact.address}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
