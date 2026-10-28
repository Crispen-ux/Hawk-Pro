import { FramedImage } from "@/components/content-image";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Minus,
  Plus,
  ShoppingCart,
  Package,
  ShieldCheck,
  Headphones,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import ProductCard from "@/components/shop/product-card";
import DeliveryEstimator from "@/components/shop/delivery-estimator";
import {
  AVAILABILITY_LABEL,
  findProductBySlug,
  getRelatedProducts,
} from "@/data/products";
import { useCart } from "@/hooks/use-cart";
import { useCatalogue } from "@/hooks/use-catalogue";
import { useSiteSettings } from "@/hooks/use-settings";
import { useDeliveryQuote } from "@/hooks/use-delivery-quote";
import { formatZar } from "@/lib/format";
import {
  normaliseProductDetails,
  SOLD_AS_LABEL,
} from "../../../../db/product-details";
export default function ProductPage() {
  const { slug = "" } = useParams();
  const { products, loading, error } = useCatalogue();
  const product = findProductBySlug(products, slug);
  const { addItem } = useCart();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1),
    [active, setActive] = useState(0),
    [zoom, setZoom] = useState(false);
  const delivery = useDeliveryQuote(
    product ? [{ productId: product.id, quantity: qty }] : [],
  );
  if (loading)
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 grid lg:grid-cols-2 gap-10">
        <Skeleton className="aspect-square" />
        <div className="space-y-5">
          <Skeleton className="h-16" />
          <Skeleton className="h-48" />
        </div>
        <span role="status" className="sr-only">
          Loading product
        </span>
      </div>
    );
  if (error)
    return (
      <div className="mx-auto max-w-3xl p-8 py-24 space-y-5">
        <Alert role="status">
          <AlertTitle>Product could not be loaded</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild>
          <Link to="/shop">Back to shop</Link>
        </Button>
      </div>
    );
  if (!product)
    return (
      <div className="p-12 text-center space-y-5">
        <h1 className="font-serif text-4xl uppercase font-bold">
          Product not found
        </h1>
        <Button asChild>
          <Link to="/shop">Back to shop</Link>
        </Button>
      </div>
    );
  const details = normaliseProductDetails(product.details),
    gallery = product.images,
    currentImage = gallery[Math.min(active, Math.max(0, gallery.length - 1))];
  const framing = details.imageFrames?.find(
    (i) => i.src === currentImage,
  )?.framing;
  const related = getRelatedProducts(products, product);
  const ready =
    product.availability === "in-stock" &&
    Number(product.stockAvailable ?? 0) >= qty &&
    product.priceZar > 0 &&
    details.soldAs !== "unspecified";
  const attributes = [
    { label: "SKU / model", value: details.sku },
    {
      label: "Speaker type",
      value:
        details.speakerType === "active"
          ? "Active / powered"
          : details.speakerType === "passive"
            ? "Passive"
            : details.speakerType === "not-applicable"
              ? "Not applicable"
              : "",
    },
    {
      label: "Continuous / RMS power",
      value: details.continuousWatts ? details.continuousWatts + " W" : "",
    },
    {
      label: "Impedance",
      value: details.impedanceOhms ? details.impedanceOhms + " Ω" : "",
    },
    { label: "Frequency response", value: details.frequencyResponse },
    { label: "Connections", value: details.connections },
    { label: "Dimensions", value: details.dimensions },
    {
      label: "Product weight",
      value: details.weightKg ? details.weightKg + " kg" : "",
    },
    {
      label: "Packed shipment weight",
      value: details.packedWeightKg ? details.packedWeightKg + " kg" : "",
    },
    ...product.specs.map((s) => ({ label: s.label, value: s.value })),
  ].filter((a) => a.value);
  function buy() {
    addItem(product!.id, qty);
    if (ready) toast.success(qty + " × " + product!.name + " added to cart");
    else navigate("/checkout");
  }
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 space-y-14">
      <nav
        aria-label="Breadcrumb"
        className="text-xs uppercase tracking-wider text-muted-foreground"
      >
        <Link to="/shop" className="hover:text-primary">
          Shop
        </Link>{" "}
        /{" "}
        <Link
          to={"/shop?category=" + product.category}
          className="hover:text-primary"
        >
          {product.category}
        </Link>{" "}
        / <span className="text-foreground">{product.name}</span>
      </nav>
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-14">
        <div className="space-y-5">
          <button
            type="button"
            className="aspect-square w-full bg-muted border relative flex items-center justify-center overflow-hidden"
            disabled={!currentImage}
            onClick={() => setZoom(true)}
            aria-label="Enlarge product image"
          >
            {currentImage ? (
              <>
                {framing ? (
                  <FramedImage
                    key={currentImage}
                    image={{
                      src: currentImage,
                      alt: product.name,
                      overlay: 0,
                      ...framing,
                    }}
                    fit="contain"
                    className="absolute inset-0 size-full"
                  />
                ) : (
                  <img
                    src={currentImage}
                    alt={
                      product.name +
                      ", view " +
                      (Math.min(active, gallery.length - 1) + 1)
                    }
                    className="size-full object-contain p-4"
                  />
                )}
                <span className="absolute bottom-4 right-4 bg-background p-2 border">
                  <ZoomIn size={18} />
                </span>
              </>
            ) : (
              <div className="text-muted-foreground text-center">
                <Package className="size-16 mx-auto mb-4" />
                <p>Product images coming soon</p>
              </div>
            )}
          </button>
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {gallery.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={"Show image " + (i + 1)}
                  aria-current={active === i}
                  className={
                    "aspect-square border-2 bg-muted " +
                    (active === i ? "border-primary" : "border-transparent")
                  }
                >
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    className="size-full object-contain p-2"
                  />
                </button>
              ))}
            </div>
          )}
          <div className="hidden lg:grid grid-cols-2 gap-4 border-t pt-5 text-sm">
            <div className="flex gap-3">
              <ShieldCheck className="size-5 text-primary shrink-0" />
              <div>
                <p className="font-semibold">Know what you are buying</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Verified product information and clear pack contents.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Headphones className="size-5 text-primary shrink-0" />
              <div>
                <p className="font-semibold">Talk to our team</p>
                <a
                  href={"mailto:" + settings.contact.email}
                  className="text-muted-foreground hover:text-primary text-xs break-all"
                >
                  {settings.contact.email}
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[.25em] text-primary mb-3">
              HAWK / {product.category}
            </p>
            <h1 className="font-serif text-5xl lg:text-6xl font-extrabold uppercase leading-none">
              {product.name}
            </h1>
            {details.sku && (
              <p className="text-xs text-muted-foreground mt-3">
                Model / SKU: {details.sku}
              </p>
            )}
          </div>
          <p className="text-muted-foreground">{product.shortDescription}</p>
          <div className="border-y py-5 space-y-2">
            <p className="text-3xl font-semibold">
              {product.priceZar > 0
                ? formatZar(product.priceZar)
                : "Price on request"}
            </p>
            <p className="text-sm font-semibold">
              {SOLD_AS_LABEL[details.soldAs]}
            </p>
            <p className="text-xs uppercase tracking-widest text-primary">
              {AVAILABILITY_LABEL[product.availability]}
              {product.availability === "in-stock" &&
              product.stockAvailable !== null &&
              product.stockAvailable !== undefined
                ? " · " + Math.max(0, product.stockAvailable) + " available"
                : ""}
            </p>
            {details.dispatchMinDays !== null &&
              details.dispatchMaxDays !== null && (
                <p className="text-sm text-muted-foreground">
                  Dispatch estimate: {details.dispatchMinDays}–
                  {details.dispatchMaxDays} working days after payment
                  confirmation.
                </p>
              )}
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <div
              className="border flex items-center"
              role="group"
              aria-label="Quantity"
            >
              <Button
                variant="ghost"
                size="icon"
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                <Minus />
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
                <Plus />
              </Button>
            </div>
            <Button size="lg" onClick={buy}>
              <ShoppingCart size={18} />
              {ready ? "Add to cart" : "Request a quote"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {ready
              ? "No account required at checkout. Delivery is calculated before payment."
              : "We will confirm availability, product details and delivery before any payment."}
          </p>
          <DeliveryEstimator
            destination={delivery.destination}
            onChange={delivery.setDestination}
            quote={delivery.quote}
            busy={delivery.busy}
            error={delivery.error}
            onEstimate={() => void delivery.estimate()}
          />
          <section className="border-t pt-5 space-y-3">
            <h2 className="font-serif text-2xl uppercase font-bold">
              What is in the box
            </h2>
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {details.included ||
                "Please contact our team to confirm box contents before ordering."}
            </p>
            {details.speakerType === "passive" && (
              <p className="text-sm border-l-2 border-primary pl-3">
                A compatible external amplifier is required. Check the listed
                impedance and power requirements.
              </p>
            )}
            {details.speakerType === "active" && (
              <p className="text-sm border-l-2 border-primary pl-3">
                Built-in amplification. Check the listed signal connections and
                power requirements for your setup.
              </p>
            )}
          </section>
        </div>
      </div>
      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-10 border-t pt-10">
        <section className="space-y-4">
          <h2 className="font-serif text-3xl uppercase font-bold">
            Built for your sound
          </h2>
          <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
            {product.description}
          </p>
          <details className="border-t pt-4">
            <summary className="cursor-pointer font-semibold">
              Warranty & support
            </summary>
            <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
              {details.warranty ||
                "Contact our team for the warranty coverage that applies to this product."}
            </p>
            <a
              href={"mailto:" + settings.contact.email}
              className="text-primary text-sm inline-block mt-3"
            >
              Ask about this product
            </a>
          </details>
          <details className="border-t pt-4">
            <summary className="cursor-pointer font-semibold">
              Returns & delivery damage
            </summary>
            <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
              {settings.sales.returnsPolicy ||
                "Please contact the store for the returns and delivery-damage process before ordering."}
            </p>
          </details>
        </section>
        <section>
          <h2 className="font-serif text-3xl uppercase font-bold mb-5">
            Technical specifications
          </h2>
          {attributes.length ? (
            <dl className="border divide-y">
              {attributes.map((s, i) => (
                <div
                  key={s.label + i}
                  className="grid grid-cols-2 gap-4 px-4 py-3 text-sm"
                >
                  <dt className="text-muted-foreground">{s.label}</dt>
                  <dd className="whitespace-pre-line">{s.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-muted-foreground text-sm">
              Contact our team for the technical data sheet.
            </p>
          )}
        </section>
      </div>
      {related.length > 0 && (
        <section className="space-y-6">
          <h2 className="font-serif text-4xl font-bold uppercase">
            Related equipment
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-w-4xl">
          <DialogTitle className="sr-only">{product.name}</DialogTitle>
          {currentImage && (
            <img
              src={currentImage}
              alt={product.name}
              className="w-full max-h-[80vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
