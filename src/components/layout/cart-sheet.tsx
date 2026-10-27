import { Link } from "react-router-dom";
import {
  ShoppingCartIcon,
  MinusIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet.tsx";
import { useCart } from "@/hooks/use-cart.tsx";
import { formatZar } from "@/lib/format.ts";

export default function CartSheet() {
  const { items, itemCount, subtotal, setQuantity, removeItem } = useCart();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Open cart, ${itemCount} items`}
        >
          <ShoppingCartIcon className="size-5" />
          {itemCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl uppercase tracking-wide">
            Your cart
          </SheetTitle>
          <SheetDescription>
            Checkout is coming soon — contact us to place your order.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          {items.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              Your cart is empty.
            </p>
          ) : (
            items.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-3 border-b pb-4">
                <img
                  src={product.images[0]}
                  alt=""
                  className="size-20 rounded-sm object-cover"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/shop/${product.slug}`}
                    className="line-clamp-2 font-medium hover:text-primary"
                  >
                    {product.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {formatZar(product.priceZar)}
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="size-8"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity(product.id, quantity - 1)}
                    >
                      <MinusIcon className="size-4" />
                    </Button>
                    <span
                      className="w-8 text-center text-sm"
                      aria-live="polite"
                    >
                      {quantity}
                    </span>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="size-8"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity(product.id, quantity + 1)}
                    >
                      <PlusIcon className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="ml-auto size-8"
                      aria-label={`Remove ${product.name}`}
                      onClick={() => removeItem(product.id)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <SheetFooter className="border-t">
          <div className="flex justify-between text-lg font-semibold">
            <span>Subtotal</span>
            <span>{formatZar(subtotal)}</span>
          </div>
          <Button disabled className="w-full">
            Checkout coming soon
          </Button>
          <p className="text-xs text-muted-foreground">
            No payment is taken and no order is placed.
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
