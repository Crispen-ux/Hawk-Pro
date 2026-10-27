import { useState } from "react";
import { useAction } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api.js";
import type { Product, ProductRecord } from "@/data/products.ts";
import { useCatalogue } from "@/hooks/use-catalogue.tsx";

export type AiPicks = { products: Product[]; message: string };

export function errorText(e: unknown): string {
  if (
    e instanceof ConvexError &&
    typeof e.data === "object" &&
    e.data !== null &&
    "message" in e.data
  ) {
    return String(e.data.message);
  }
  return "Something went wrong. Please try again.";
}

function catalogueFor(products: ProductRecord[]) {
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    shortDescription: p.shortDescription,
  }));
}

function resolve(
  products: ProductRecord[],
  ids: string[],
  message: string,
): AiPicks {
  const picks = ids.flatMap((id) => products.find((p) => p.id === id) ?? []);
  return { products: picks, message };
}

export function useFindProducts() {
  const run = useAction(api.ai.shop.findProducts);
  const { products } = useCatalogue();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AiPicks | null>(null);

  const search = async (query: string) => {
    setLoading(true);
    setError("");
    try {
      const r = await run({ query, catalogue: catalogueFor(products) });
      setResult(resolve(products, r.ids, r.message));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  };
  return { search, loading, error, result };
}

export function useRentalSuggest() {
  const run = useAction(api.ai.shop.suggestRentalEquipment);
  const { products } = useCatalogue();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AiPicks | null>(null);

  const suggest = async (input: {
    eventType: string;
    guests: string;
    location: string;
    notes: string;
  }) => {
    setLoading(true);
    setError("");
    try {
      const r = await run({ ...input, catalogue: catalogueFor(products) });
      setResult(resolve(products, r.ids, r.message));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  };
  return { suggest, loading, error, result };
}
