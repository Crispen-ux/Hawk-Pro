import {
  checkoutAttemptKey,
  getCheckoutAttempt,
  rememberCheckout,
} from "@/lib/checkout-attempt";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  Package,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/use-cart";
import { useCatalogue } from "@/hooks/use-catalogue";
import { useSiteSettings } from "@/hooks/use-settings";
import { useDeliveryQuote } from "@/hooks/use-delivery-quote";
import DeliveryEstimator from "@/components/shop/delivery-estimator";
import { formatZar } from "@/lib/format";
import { request } from "@/lib/api";
import { SOLD_AS_LABEL } from "../../../db/product-details";
import {
  SADC_COUNTRIES,
  type CheckoutInput,
} from "../../../db/sales-validation";
type Values = CheckoutInput["customer"] & { notes: string; consent: boolean };
export default function CheckoutPage() {
  const cart = useCart();
  const catalogue = useCatalogue();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const [pendingOrder, setPendingOrder] = useState(() => {
    const a = getCheckoutAttempt();
    return a?.access ? { id: a.key, access: a.access } : null;
  });
  const [stage, setStage] = useState<"details" | "review">("details"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lines = cart.items.map((i) => ({
    productId: i.product.id,
    quantity: i.quantity,
  }));
  const delivery = useDeliveryQuote(lines);
  const q = delivery.quote;
  const form = useForm<Values>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      suburb: "",
      city: "",
      province: "",
      billingSame: true,
      billingAddressLine1: "",
      billingCity: "",
      billingProvince: "",
      billingPostcode: "",
      billingCountry: "ZA",
      notes: "",
      consent: false,
    },
  });
  const billingSame = form.watch("billingSame");
  const reviewed = form.watch();
  async function submit(values: Values) {
    setError("");
    if (!q) {
      setStage("details");
      setError("Calculate an up-to-date delivery estimate before continuing.");
      return;
    }
    if (q.payable && !/^\d{4}$/.test(delivery.destination.postcode)) {
      setStage("details");
      setError("Enter a four-digit postcode for the South African address.");
      return;
    }
    if (
      q.payable &&
      !values.billingSame &&
      (!values.billingAddressLine1.trim() ||
        !values.billingCity.trim() ||
        !/^\d{4}$/.test(values.billingPostcode))
    ) {
      setStage("details");
      setError("Enter the complete billing address and four-digit postcode.");
      return;
    }
    if (stage === "details") {
      setStage("review");
      window.scrollTo(0, 0);
      return;
    }
    if (!values.consent) {
      form.setError("consent", {
        message: "Please confirm your details before continuing.",
      });
      return;
    }
    setBusy(true);
    try {
      const { notes, consent, ...customer } = values;
      if (customer.billingSame)
        customer.billingCountry = delivery.destination.country;
      const payload = {
        lines,
        destination: delivery.destination,
        customer,
        notes,
        consent,
        intent: q.payable ? "pay" : "quote",
      };
      const key = await checkoutAttemptKey(payload);
      const result = await request<{
        receipt: { id: string; payment: string };
        access: string;
        redirectUrl: string | null;
        emailWarning?: string;
      }>("/api/checkout", {
        method: "POST",
        body: { ...payload, key, quoteId: q.quoteId },
      });
      rememberCheckout(result.receipt.id, result.access);
      if (result.redirectUrl) {
        const redirect = new URL(result.redirectUrl);
        if (
          redirect.protocol !== "https:" ||
          !redirect.hostname.endsWith(".payflex.co.za")
        )
          throw new Error(
            "Unexpected payment address. Please contact the store.",
          );
        window.location.assign(result.redirectUrl);
      } else
        navigate(
          "/checkout/return/" + result.receipt.id + "/" + result.access,
          { replace: true },
        );
    } catch (e) {
      if (typeof e === "object" && e !== null && "payload" in e) {
        const data = e.payload as {
          savedOrder?: { id: string; access: string };
        };
        if (data?.savedOrder) {
          rememberCheckout(data.savedOrder.id, data.savedOrder.access);
          setPendingOrder(data.savedOrder);
        }
      }
      if (
        typeof e === "object" &&
        e !== null &&
        "status" in e &&
        e.status === 409
      )
        setStage("details");
      setError(
        e instanceof Error
          ? e.message
          : "Checkout could not be completed. Your details and cart are still here.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (pendingOrder)
    return (
      <div className="max-w-xl mx-auto px-5 py-20 space-y-5">
        <h1 className="font-serif text-4xl uppercase font-bold">
          Your checkout is in progress
        </h1>
        <p className="text-muted-foreground">
          Open your saved order to check payment status or resume Payflex. We
          will check the existing payment before starting another.
        </p>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <Button asChild>
          <Link
            to={
              "/checkout/return/" + pendingOrder.id + "/" + pendingOrder.access
            }
          >
            View saved order
          </Link>
        </Button>
      </div>
    );
  if (catalogue.loading)
    return (
      <p className="p-12 text-center" role="status">
        Loading your checkout…
      </p>
    );
  if (catalogue.error)
    return (
      <div className="max-w-2xl mx-auto p-10 space-y-5" role="alert">
        <h1 className="font-serif text-4xl uppercase font-bold">
          Your cart could not be loaded
        </h1>
        <p>{catalogue.error}</p>
        <Button onClick={catalogue.refresh}>Try again</Button>
      </div>
    );
  if (!cart.items.length)
    return (
      <div className="max-w-xl mx-auto py-24 px-5 text-center space-y-5">
        <Package className="mx-auto size-12 text-primary" />
        <h1 className="font-serif text-4xl uppercase font-bold">
          Your cart is empty
        </h1>
        <p className="text-muted-foreground">
          Choose your speakers and equipment, then come back to checkout.
        </p>
        <Button asChild>
          <Link to="/shop">Explore the range</Link>
        </Button>
      </div>
    );
  const subtotal = q?.subtotalCents ?? Math.round(cart.subtotal * 100);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 space-y-8">
      <header className="border-b pb-7">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-5"
        >
          <ArrowLeft size={14} />
          Continue shopping
        </Link>
        <div className="flex flex-wrap justify-between gap-4 items-center">
          <div>
            <p className="text-primary text-xs uppercase tracking-[.3em] mb-2">
              HAWK / Checkout
            </p>
            <h1 className="font-serif text-5xl font-extrabold uppercase">
              {stage === "review" ? "Review your order" : "Make it yours."}
            </h1>
          </div>
          <p className="flex gap-2 items-center text-sm text-muted-foreground">
            <LockKeyhole size={17} className="text-primary" />
            Guest checkout. No account required.
          </p>
        </div>
        <ol className="flex gap-6 text-xs uppercase tracking-widest mt-6">
          <li
            className={
              stage === "details" ? "text-primary" : "text-muted-foreground"
            }
          >
            01 Details & delivery
          </li>
          <li
            className={
              stage === "review" ? "text-primary" : "text-muted-foreground"
            }
          >
            02 Review & {q?.payable ? "payment" : "request"}
          </li>
        </ol>
      </header>
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
        <form
          onSubmit={form.handleSubmit(submit)}
          noValidate
          className="space-y-6"
        >
          {error && (
            <p
              role="alert"
              className="border border-destructive p-4 text-destructive"
            >
              {error}
            </p>
          )}
          {stage === "details" ? (
            <>
              <section className="border p-6 space-y-5">
                <h2 className="font-serif text-2xl uppercase font-bold">
                  Contact details
                </h2>
                <p className="text-sm text-muted-foreground">
                  We will email your confirmation and delivery updates.
                </p>
                <div className="grid sm:grid-cols-2 gap-5">
                  {(
                    [
                      ["name", "Full name", "text"],
                      ["email", "Email address", "email"],
                      ["phone", "Phone number", "tel"],
                    ] as const
                  ).map(([key, label, type]) => (
                    <label key={key} className="block text-sm space-y-2">
                      {label}
                      <Input
                        type={type}
                        autoComplete={
                          key === "name"
                            ? "name"
                            : key === "email"
                              ? "email"
                              : "tel"
                        }
                        {...form.register(key, {
                          required: "This field is required",
                          ...(key === "email"
                            ? {
                                pattern: {
                                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                  message: "Enter a valid email address",
                                },
                              }
                            : {}),
                        })}
                      />
                      {form.formState.errors[key] && (
                        <span className="text-destructive text-xs">
                          {form.formState.errors[key]?.message}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </section>
              <DeliveryEstimator
                destination={delivery.destination}
                onChange={delivery.setDestination}
                quote={q}
                busy={delivery.busy}
                error={delivery.error}
                onEstimate={() => void delivery.estimate()}
              />
              <section className="border p-6 space-y-5">
                <h2 className="font-serif text-2xl uppercase font-bold">
                  {delivery.destination.method === "collection"
                    ? "Your address"
                    : "Delivery address"}
                </h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  {(
                    [
                      ["addressLine1", "Street address", true],
                      [
                        "addressLine2",
                        "Apartment / building (optional)",
                        false,
                      ],
                      ["suburb", "Suburb (optional)", false],
                      ["city", "Town / city", true],
                      ["province", "Province / region (optional)", false],
                    ] as const
                  ).map(([key, label, required]) => (
                    <label key={key} className="block text-sm space-y-2">
                      {label}
                      <Input
                        {...form.register(key, {
                          required: required ? "This field is required" : false,
                        })}
                      />
                      {form.formState.errors[key] && (
                        <span className="text-destructive text-xs">
                          {form.formState.errors[key]?.message}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {q?.payable && (
                  <>
                    <label className="flex gap-3 items-center text-sm">
                      <input
                        type="checkbox"
                        {...form.register("billingSame")}
                      />
                      Billing address is the same as the address above
                    </label>
                    {!billingSame && (
                      <div className="grid sm:grid-cols-2 gap-5 border-t pt-5">
                        {(
                          [
                            ["billingAddressLine1", "Billing street address"],
                            ["billingCity", "Billing city"],
                            ["billingProvince", "Billing province"],
                            ["billingPostcode", "Billing postcode"],
                          ] as const
                        ).map(([key, label]) => (
                          <label key={key} className="text-sm space-y-2">
                            {label}
                            <Input {...form.register(key)} />
                            {form.formState.errors[key] && (
                              <span className="text-destructive text-xs">
                                {form.formState.errors[key]?.message}
                              </span>
                            )}
                          </label>
                        ))}
                        <label className="text-sm space-y-2">
                          Billing country
                          <select
                            className="w-full border bg-background p-2"
                            {...form.register("billingCountry")}
                          >
                            <option value="ZA">South Africa</option>
                          </select>
                        </label>
                      </div>
                    )}
                  </>
                )}
              </section>
              <label className="block text-sm space-y-2">
                Delivery notes (optional)
                <Textarea
                  {...form.register("notes")}
                  placeholder="Access instructions or anything we should know"
                />
              </label>
              <Button type="submit" size="lg" disabled={!q || delivery.busy}>
                Review {q?.payable ? "order" : "quote request"}
                <ArrowRight size={16} />
              </Button>
            </>
          ) : (
            <>
              <section className="border p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <h2 className="font-serif text-2xl font-bold uppercase">
                    Your details
                  </h2>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStage("details")}
                  >
                    Edit
                  </Button>
                </div>
                <p>
                  {reviewed.name}
                  <br />
                  {reviewed.email}
                  <br />
                  {reviewed.phone}
                </p>
                <p className="text-sm text-muted-foreground">
                  {[
                    reviewed.addressLine1,
                    reviewed.addressLine2,
                    reviewed.suburb,
                    reviewed.city,
                    reviewed.province,
                    delivery.destination.postcode,
                    SADC_COUNTRIES.find(
                      (c) => c.code === delivery.destination.country,
                    )?.name,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p className="text-sm">
                  {delivery.destination.method === "collection"
                    ? "Store collection"
                    : "Delivery"}{" "}
                  · {q?.message}
                </p>
              </section>
              <section className="border p-6 space-y-4">
                <h2 className="font-serif text-2xl uppercase font-bold">
                  {q?.payable ? "Payment" : "Quote request"}
                </h2>
                {q?.payable ? (
                  <>
                    <p className="font-semibold flex items-center gap-2">
                      <ShieldCheck size={19} className="text-primary" />
                      Payflex
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Continue to Payflex to complete its eligibility and
                      payment checks securely. We only confirm payment after
                      Payflex verifies it.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No payment will be taken. Our team will confirm
                    availability, delivery charges and payment arrangements for
                    your destination.
                  </p>
                )}
              </section>
              <label className="flex items-start gap-3 text-sm">
                <input
                  className="mt-1"
                  type="checkbox"
                  {...form.register("consent")}
                />
                I have checked my contact details, items and delivery selection.
              </label>
              {form.formState.errors.consent && (
                <p className="text-sm text-destructive" role="alert">
                  {form.formState.errors.consent.message}
                </p>
              )}
              <div className="flex justify-between gap-4 border-t py-4 text-lg font-semibold">
                <span>{q?.payable ? "Total payable" : "Quote request"}</span>
                <span>
                  {q?.payable && q.totalCents !== null
                    ? formatZar(q.totalCents / 100)
                    : "No payment taken"}
                </span>
              </div>
              <Button type="submit" size="lg" disabled={busy}>
                {busy
                  ? "Please wait…"
                  : q?.payable
                    ? "Continue to Payflex"
                    : "Send quote request"}
                <ArrowRight size={16} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => setStage("details")}
              >
                Back to details
              </Button>
            </>
          )}
          {settings.sales.returnsPolicy && (
            <details className="border-t pt-4 text-sm">
              <summary className="cursor-pointer font-semibold">
                Returns, warranty & delivery support
              </summary>
              <p className="whitespace-pre-line text-muted-foreground mt-3">
                {settings.sales.returnsPolicy}
              </p>
            </details>
          )}
        </form>
        <aside className="border p-6 space-y-5 lg:sticky lg:top-24">
          <h2 className="font-serif text-2xl uppercase font-bold">
            Your equipment
          </h2>
          {cart.items.map(({ product, quantity }) => {
            const priced = q?.items.find((i) => i.productId === product.id);
            return (
              <article key={product.id} className="flex gap-4 border-b pb-5">
                {product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt=""
                    className="size-16 object-contain bg-muted"
                  />
                ) : (
                  <Package className="size-12 text-muted-foreground" />
                )}
                <div className="flex-1 min-w-0">
                  <Link
                    to={"/shop/" + product.slug}
                    className="font-semibold hover:text-primary"
                  >
                    {product.name}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-1">
                    {SOLD_AS_LABEL[product.details.soldAs]}
                  </p>
                  <p className="text-sm mt-2">
                    {quantity} ×{" "}
                    {formatZar(
                      priced ? priced.unitPriceCents / 100 : product.priceZar,
                    )}
                  </p>
                  {stage === "details" && (
                    <div className="flex gap-3 mt-2 items-center">
                      <label className="text-xs flex gap-2 items-center">
                        Qty
                        <Input
                          aria-label={"Quantity for " + product.name}
                          type="number"
                          min="1"
                          max="99"
                          className="w-20 h-8"
                          value={quantity}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            if (
                              Number.isInteger(value) &&
                              value >= 1 &&
                              value <= 99
                            )
                              cart.setQuantity(product.id, value);
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        className="text-xs underline text-muted-foreground"
                        onClick={() => cart.removeItem(product.id)}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt>
                {q?.priceOnRequest ? "Known item prices" : "Items subtotal"}
              </dt>
              <dd>{formatZar(subtotal / 100)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>
                {delivery.destination.method === "collection"
                  ? "Collection"
                  : "Delivery"}
              </dt>
              <dd>
                {!q
                  ? "Calculate above"
                  : q.shippingCents === null
                    ? "To be quoted"
                    : q.shippingCents === 0
                      ? "Free"
                      : formatZar(q.shippingCents / 100)}
              </dd>
            </div>
            <div className="flex justify-between border-t pt-4 font-bold text-xl">
              <dt>{q?.payable ? "Total" : "Estimated total"}</dt>
              <dd>
                {q?.totalCents !== null && q?.totalCents !== undefined
                  ? formatZar(q.totalCents / 100)
                  : "Awaiting delivery quote"}
              </dd>
            </div>
            {!!q?.taxIncludedCents && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <dt>VAT already included</dt>
                <dd>{formatZar(q.taxIncludedCents / 100)}</dd>
              </div>
            )}
          </dl>
          <p className="text-xs text-muted-foreground">
            {q?.payable
              ? "You will see this total before confirming payment on Payflex."
              : "A quote request is not a paid or confirmed order."}
          </p>
        </aside>
      </div>
    </div>
  );
}
