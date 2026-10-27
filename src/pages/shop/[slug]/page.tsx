import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MinusIcon, PlusIcon, ShoppingCartIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import ProductCard from "@/components/shop/product-card.tsx";
import {
  AVAILABILITY_LABEL,
  findProductBySlug,
  getRelatedProducts,
} from "@/data/products.ts";
import { useCart } from "@/hooks/use-cart.tsx";
import { useCatalogue } from "@/hooks/use-catalogue.tsx";
import { formatZar } from "@/lib/format.ts";

export default function ProductPage() {
  const { slug = "" } = useParams();
  const { products, loading, error } = useCatalogue();
  const product = findProductBySlug(products, slug);
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-12 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
        <span className="sr-only" role="status">
          Loading product
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-24">
        <Alert role="status">
          <AlertTitle>Product could not be loaded</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild>
          <Link to="/shop">Back to shop</Link>
        </Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-24 text-center">
        <h1 className="font-serif text-4xl font-bold uppercase">
          Product not found
        </h1>
        <Button asChild>
          <Link to="/shop">Back to shop</Link>
        </Button>
      </div>
    );
  }

  const related = getRelatedProducts(products, product);
  const gallery = product.images;
  const currentImage =
    gallery[Math.min(active, Math.max(gallery.length - 1, 0))];

  return (
    <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
            {currentImage && (
              <img
                src={currentImage}
                alt={`${product.name}, view ${Math.min(active, gallery.length - 1) + 1}`}
                className="size-full object-cover"
              />
            )}
          </div>
          <div className="grid grid-cols-4 gap-3">
            {gallery.map((src, i) => (
              <button
                key={src + i}
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={active === i}
                className={`aspect-square overflow-hidden border-2 focus-visible:outline-2 focus-visible:outline-primary ${active === i ? "border-primary" : "border-transparent"}`}
              >
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <nav
            aria-label="Breadcrumb"
            className="text-sm text-muted-foreground"
          >
            <Link to="/shop" className="hover:text-primary">
              Shop
            </Link>{" "}
            /{" "}
            <Link
              to={`/shop?category=${product.category}`}
              className="capitalize hover:text-primary"
            >
              {product.category}
            </Link>
          </nav>
          <h1 className="font-serif text-5xl font-extrabold uppercase leading-none">
            {product.name}
          </h1>
          <p className="text-3xl font-semibold">
            {formatZar(product.priceZar)}
          </p>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            {AVAILABILITY_LABEL[product.availability]}
          </p>
          <p className="text-muted-foreground">{product.description}</p>

          <div className="flex flex-wrap items-center gap-4">
            <div
              className="flex items-center border"
              role="group"
              aria-label="Quantity"
            >
              <Button
                variant="ghost"
                size="icon"
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                <MinusIcon />
              </Button>
              <span className="w-10 text-center" aria-live="polite">
                {qty}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Increase quantity"
                onClick={() => setQty((q) => Math.min(99, q + 1))}
              >
                <PlusIcon />
              </Button>
            </div>
            <Button
              size="lg"
              onClick={() => {
                addItem(product.id, qty);
                toast.success(`${qty} x ${product.name} added to cart`);
              }}
            >
              <ShoppingCartIcon /> Add to cart
            </Button>
          </div>

          <Alert>
            <AlertDescription>
              Checkout is not connected yet: add items to your cart and contact
              us to place your order.
            </AlertDescription>
          </Alert>

          <section aria-labelledby="specs">
            <h2
              id="specs"
              className="mb-2 font-serif text-2xl font-bold uppercase"
            >
              Technical specifications
            </h2>
            {product.specs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No specifications listed yet.
              </p>
            ) : (
              <dl className="divide-y border">
                {product.specs.map((s) => (
                  <div
                    key={s.label}
                    className="grid grid-cols-2 gap-4 px-4 py-2.5 text-sm"
                  >
                    <dt className="text-muted-foreground">{s.label}</dt>
                    <dd>{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        </div>
      </div>

      {related.length > 0 && (
        <section className="space-y-6">
          <h2 className="font-serif text-4xl font-bold uppercase">
            Related products
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
