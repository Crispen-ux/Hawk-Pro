import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PackageXIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import { AVAILABILITY_LABEL, CATEGORIES } from "@/data/products.ts";
import type { ProductRecord } from "../../../../db/validation.ts";
import { deleteProduct, fetchAllProducts } from "@/lib/api.ts";
import { formatDateTime, formatZar } from "@/lib/format.ts";

const CATEGORY_NAMES: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.name]),
);

export default function AdminProducts() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<ProductRecord | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(() => {
    let cancelled = false;
    fetchAllProducts()
      .then((rows) => {
        if (!cancelled) setProducts(rows);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setProducts([]);
          setError(e instanceof Error ? e.message : "Could not load products");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load, attempt]);

  // Flag resets belong to the click handler so the effect stays free of
  // synchronous setState calls.
  const retry = () => {
    setLoading(true);
    setError("");
    setAttempt((v) => v + 1);
  };

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const rows = [...products].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
    if (!term) return rows;
    return rows.filter((p) =>
      `${p.name} ${p.slug} ${p.category}`.toLowerCase().includes(term),
    );
  }, [products, query]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteProduct(pendingDelete.id);
      setProducts((rows) => rows.filter((p) => p.id !== pendingDelete.id));
      toast.success(`${pendingDelete.name} deleted`);
      setPendingDelete(null);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not delete that product",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
            Catalogue
          </p>
          <h1 className="font-serif text-5xl font-extrabold uppercase leading-none">
            Products
          </h1>
        </div>
        <Button asChild>
          <Link to="/admin/products/new">
            <PlusIcon /> Add product
          </Link>
        </Button>
      </header>

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Products unavailable</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {error}
            <Button size="sm" variant="secondary" onClick={retry}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!loading && !error && (
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, slug or category"
          aria-label="Search products"
          className="max-w-sm"
        />
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageXIcon />
            </EmptyMedia>
            <EmptyTitle>
              {products.length === 0 ? "No products yet" : "No matches"}
            </EmptyTitle>
            <EmptyDescription>
              {products.length === 0
                ? "Add your first product to publish it to the storefront."
                : "Try a different search term."}
            </EmptyDescription>
          </EmptyHeader>
          {products.length === 0 && (
            <EmptyContent>
              <Button asChild size="sm">
                <Link to="/admin/products/new">
                  <PlusIcon /> Add product
                </Link>
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="size-10 shrink-0 overflow-hidden bg-muted">
                      {product.images[0] && (
                        <img
                          src={product.images[0]}
                          alt=""
                          className="size-full object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {product.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        /shop/{product.slug}
                      </span>
                    </span>
                  </div>
                </TableCell>
                <TableCell className="capitalize">
                  {CATEGORY_NAMES[product.category] ?? product.category}
                </TableCell>
                <TableCell className="text-right">
                  {formatZar(product.priceZar)}
                </TableCell>
                <TableCell>
                  <span className="flex flex-wrap gap-1">
                    <Badge
                      variant={product.published ? "default" : "secondary"}
                    >
                      {product.published ? "Published" : "Draft"}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {AVAILABILITY_LABEL[product.availability]}
                    </Badge>
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(product.updatedAt)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon">
                      <Link
                        to={`/admin/products/${product.id}`}
                        aria-label={`Edit ${product.name}`}
                      >
                        <PencilIcon />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${product.name}`}
                      onClick={() => setPendingDelete(product)}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.name} will be removed from the storefront. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deleting ? "Deleting…" : "Delete product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
