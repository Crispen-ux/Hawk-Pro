import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { type Product } from "@/data/products.ts";
import { useCatalogue } from "./use-catalogue.tsx";

// Cart stores only ids + quantities so prices always come from the catalogue.
type CartLine = { productId: string; quantity: number };
type Action =
  | { type: "add"; productId: string; quantity: number }
  | { type: "set"; productId: string; quantity: number }
  | { type: "remove"; productId: string }
  | { type: "clear" };

const STORAGE_KEY = "hawk-cart";
const MAX_QTY = 99;

function reducer(state: CartLine[], action: Action): CartLine[] {
  switch (action.type) {
    case "add": {
      const existing = state.find((l) => l.productId === action.productId);
      if (!existing)
        return [
          ...state,
          { productId: action.productId, quantity: action.quantity },
        ];
      return state.map((l) =>
        l.productId === action.productId
          ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + action.quantity) }
          : l,
      );
    }
    case "set":
      if (action.quantity <= 0)
        return state.filter((l) => l.productId !== action.productId);
      return state.map((l) =>
        l.productId === action.productId
          ? { ...l, quantity: Math.min(MAX_QTY, action.quantity) }
          : l,
      );
    case "remove":
      return state.filter((l) => l.productId !== action.productId);
    case "clear":
      return [];
  }
}

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Lines are kept as-is: the catalogue arrives asynchronously, so ids that
    // no longer exist simply resolve to no item instead of being purged here.
    return parsed.filter(
      (l): l is CartLine =>
        typeof l === "object" &&
        l !== null &&
        typeof l.productId === "string" &&
        typeof l.quantity === "number",
    );
  } catch {
    return [];
  }
}

export type CartItem = { product: Product; quantity: number };

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { products } = useCatalogue();
  const [lines, dispatch] = useReducer(reducer, undefined, load);

  const value = useMemo<CartContextValue>(() => {
    const items = lines.flatMap((l) => {
      const product = products.find((p) => p.id === l.productId);
      return product ? [{ product, quantity: l.quantity }] : [];
    });
    return {
      items,
      itemCount: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.product.priceZar * i.quantity, 0),
      addItem: (productId, quantity = 1) =>
        dispatch({ type: "add", productId, quantity }),
      setQuantity: (productId, quantity) =>
        dispatch({ type: "set", productId, quantity }),
      removeItem: (productId) => dispatch({ type: "remove", productId }),
      clear: () => dispatch({ type: "clear" }),
    };
  }, [lines, products]);

  // Persist on every change; cheap and keeps the provider free of effects.
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    /* storage unavailable: cart still works for the session */
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Provider and hook share one context, so they stay in one file by design.
// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
