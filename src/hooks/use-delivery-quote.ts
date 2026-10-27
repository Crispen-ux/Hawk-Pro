import { useState } from "react";
import { request } from "@/lib/api";
import type { EstimateInput } from "../../db/sales-validation";
import type { DeliveryQuote } from "../../db/checkout-model";
export function useDeliveryQuote(lines: EstimateInput["lines"]) {
  const [destination, setDestination] = useState<EstimateInput["destination"]>({
    country: "ZA",
    postcode: "",
    method: "delivery",
  });
  const [saved, setSaved] = useState<{
    key: string;
    quote: DeliveryQuote;
  } | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const key = JSON.stringify({ lines, destination });
  const quote = saved?.key === key ? saved.quote : null;
  async function estimate() {
    setBusy(true);
    setError("");
    try {
      const result = await request<{ quote: DeliveryQuote }>("/api/delivery", {
        method: "POST",
        body: { lines, destination },
      });
      setSaved({ key, quote: result.quote });
    } catch (e) {
      setError(
        typeof e === "object" &&
          e !== null &&
          "status" in e &&
          typeof e.status === "number" &&
          e.status >= 500
          ? "Delivery estimates are temporarily unavailable. Please try again or contact the store for a quote."
          : e instanceof Error
            ? e.message
            : "Could not estimate delivery",
      );
    } finally {
      setBusy(false);
    }
  }
  return { destination, setDestination, quote, busy, error, estimate };
}
