import { Link } from "react-router-dom";
import { ShoppingCartIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import { AVAILABILITY_LABEL, type Product } from "@/data/products.ts";
import { useCart } from "@/hooks/use-cart.tsx";
import { formatZar } from "@/lib/format.ts";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const href = `/shop/${product.slug}`;

  return (
    <article className="group flex flex-col border bg-card">
      <Link
        to={href}
        className="relative block aspect-[4/3] overflow-hidden bg-muted"
        aria-label={`View ${product.name}`}
      >
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 bg-background/90 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider">
          {AVAILABILITY_LABEL[product.availability]}
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-serif text-xl font-semibold uppercase leading-tight tracking-wide">
          <Link to={href} className="hover:text-primary">
            {product.name}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground">
          {product.shortDescription}
        </p>
        <p className="mt-auto pt-2 text-lg font-semibold">
          {formatZar(product.priceZar)}
        </p>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button asChild variant="secondary">
            <Link to={href}>View</Link>
          </Button>
          <Button
            onClick={() => {
              addItem(product.id);
              toast.success(`${product.name} added to cart`);
            }}
          >
            <ShoppingCartIcon /> Add
          </Button>
        </div>
      </div>
    </article>
  );
}
