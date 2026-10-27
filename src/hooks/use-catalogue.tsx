import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ProductRecord } from "../../db/validation.ts";
import { ApiError, fetchProducts } from "@/lib/api.ts";

type CatalogueValue = {
  products: ProductRecord[];
  loading: boolean;
  error: string;
  refresh: () => void;
};

const CatalogueContext = createContext<CatalogueValue | null>(null);

// Single source of products for the storefront: the shop, cart, home page and
// AI helpers all read from here so one refresh updates everything.
export function CatalogueProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  // Loading flags are reset here (an event handler), not in the effect, so a
  // refresh visibly re-enters the loading state without a sync setState.
  const refresh = useCallback(() => {
    setLoading(true);
    setError("");
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((rows) => {
        if (cancelled) return;
        setProducts(rows);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setProducts([]);
        setError(e instanceof ApiError ? e.message : "Cannot reach the server");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const value = useMemo(
    () => ({ products, loading, error, refresh }),
    [products, loading, error, refresh],
  );

  return (
    <CatalogueContext.Provider value={value}>
      {children}
    </CatalogueContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCatalogue(): CatalogueValue {
  const ctx = useContext(CatalogueContext);
  if (!ctx)
    throw new Error("useCatalogue must be used inside CatalogueProvider");
  return ctx;
}
