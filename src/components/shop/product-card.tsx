import { FramedImage } from "@/components/content-image";
import ProductCardImage from "./product-card-image";
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
  const framing = product.details?.imageFrames?.find(
    (i) => i.src === product.images[0],
  )?.framing;

  return (
    <article className="group flex flex-col border bg-card">
      <Link
        to={href}
        className="relative block aspect-[4/3] overflow-hidden bg-muted"
        aria-label={`View ${product.name}`}
      >
        {framing ? (
          <FramedImage
            image={{
              src: product.images[0],
              alt: product.name,
              overlay: 0,
              ...framing,
            }}
            fit="contain"
            className="absolute inset-0 size-full"
          />
        ) : (
          <ProductCardImage
            src={product.images[0]}
            alt={product.name}
            scale={product.details?.imageDisplayScale ?? 100}
          />
        )}
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
