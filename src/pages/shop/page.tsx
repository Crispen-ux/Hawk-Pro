import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchXIcon } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import ProductCard from "@/components/shop/product-card.tsx";
import { CATEGORIES, type CategoryId } from "@/data/products.ts";
import { useCatalogue } from "@/hooks/use-catalogue.tsx";

type Sort = "featured" | "price-asc" | "price-desc" | "name-asc";

export default function ShopPage() {
  const [params, setParams] = useSearchParams();
  const { products: catalogue, loading, error } = useCatalogue();
  const category = params.get("category") ?? "all";
  const q = params.get("q") ?? "";
  const sort = (params.get("sort") ?? "featured") as Sort;

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== "all" && value !== "featured") next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const products = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = catalogue.filter(
      (p) =>
        (category === "all" || p.category === (category as CategoryId)) &&
        (!term ||
          `${p.name} ${p.shortDescription}`.toLowerCase().includes(term)),
    );
    if (sort === "price-asc") list.sort((a, b) => a.priceZar - b.priceZar);
    if (sort === "price-desc") list.sort((a, b) => b.priceZar - a.priceZar);
    if (sort === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [catalogue, category, q, sort]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-12 lg:px-8">
      <header className="space-y-2">
        <h1 className="font-serif text-5xl font-extrabold uppercase">Shop</h1>
        <p className="text-sm text-muted-foreground">
          Speakers, subwoofers, accessories and matched sound systems.
        </p>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0"
          role="group"
          aria-label="Filter by category"
        >
          {[{ id: "all", name: "All" }, ...CATEGORIES].map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={category === c.id ? "default" : "secondary"}
              aria-pressed={category === c.id}
              onClick={() => update("category", c.id)}
            >
              {c.name}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            type="search"
            value={q}
            onChange={(e) => update("q", e.target.value)}
            placeholder="Search products"
            aria-label="Search products"
            className="w-full lg:w-64"
          />
          <Select value={sort} onValueChange={(v) => update("sort", v)}>
            <SelectTrigger className="w-44" aria-label="Sort products">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-asc">Price: low to high</SelectItem>
              <SelectItem value="price-desc">Price: high to low</SelectItem>
              <SelectItem value="name-asc">Name: A to Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <Alert role="status">
          <AlertTitle>Shop unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : loading ? (
        <div
          className="grid grid-cols-2 gap-x-3 gap-y-8 lg:grid-cols-4 lg:gap-x-4"
          aria-hidden="true"
        >
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/3] w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>No products found</EmptyTitle>
            <EmptyDescription>
              Try a different search or category.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={() => setParams({}, { replace: true })}>
              Clear filters
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 lg:grid-cols-4 lg:gap-x-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
