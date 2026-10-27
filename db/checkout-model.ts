import { SOLD_AS_LABEL } from "./product-details.ts";
import type { ProductDetails } from "./product-details.ts";
import type { SalesSettings, EstimateInput } from "./sales-validation.ts";
export type QuoteProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  priceZar: number;
  published: boolean;
  availability: string;
  details: ProductDetails;
  updatedAt: string | Date;
  stockAvailable?: number | null;
};
export type OrderItem = {
  productId: string;
  name: string;
  packLabel?: string;
  sku: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  version: string;
};
export type DeliveryQuote = {
  quoteId: string;
  items: OrderItem[];
  subtotalCents: number;
  priceOnRequest: boolean;
  shippingCents: number | null;
  totalCents: number | null;
  taxIncludedCents: number;
  payable: boolean;
  crossBorder: boolean;
  deliveryEstimated: boolean;
  message: string;
  zoneName: string | null;
  weightKg: number | null;
  dispatchMinDays: number | null;
  dispatchMaxDays: number | null;
  transitMinDays: number | null;
  transitMaxDays: number | null;
  arrivalMin: string | null;
  arrivalMax: string | null;
  notes: string;
};
export const toCents = (value: number) => Math.round(value * 100);
function workdays(date: Date, days: number) {
  const d = new Date(date);
  let left = days;
  if (days === 0)
    while (d.getUTCDay() === 0 || d.getUTCDay() === 6)
      d.setUTCDate(d.getUTCDate() + 1);
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) left--;
  }
  return d.toISOString().slice(0, 10);
}
export function orderItems(data: Record<string, unknown>): OrderItem[] {
  if (Array.isArray(data.items)) return data.items as OrderItem[];
  return typeof data.productId === "string"
    ? [
        {
          productId: data.productId,
          name: String(data.productName ?? ""),
          sku: "",
          quantity: Number(data.quantity ?? 0),
          unitPriceCents: 0,
          lineTotalCents: toCents(Number(data.total ?? 0)),
          version: "",
        },
      ]
    : [];
}
export function productMissingDetails(p: QuoteProduct) {
  const d = p.details;
  const missing: string[] = [];
  if (d.soldAs === "unspecified") missing.push("single / pair / set");
  if (!d.included.trim()) missing.push("box contents");
  if (
    ["speakers", "subwoofers"].includes(p.category) &&
    d.speakerType === "unspecified"
  )
    missing.push("active / passive type");
  if (d.dispatchMinDays === null || d.dispatchMaxDays === null)
    missing.push("dispatch lead time");
  return missing;
}
export function calculateDelivery(
  input: EstimateInput,
  products: QuoteProduct[],
  sales: SalesSettings,
  now = new Date(),
): Omit<DeliveryQuote, "quoteId"> {
  const selected = input.lines.map((line) => {
    const product = products.find(
      (p) => p.id === line.productId && p.published,
    );
    if (!product)
      throw new Error("A cart item is no longer available. Update your cart.");
    return { ...line, product };
  });
  const items = selected.map(({ product: p, quantity }) => ({
    productId: p.id,
    name: p.name,
    packLabel: SOLD_AS_LABEL[p.details.soldAs],
    sku: p.details.sku || p.id,
    quantity,
    unitPriceCents: toCents(p.priceZar),
    lineTotalCents: toCents(p.priceZar) * quantity,
    version: new Date(p.updatedAt).toISOString(),
  }));
  const priceOnRequest = items.some((i) => i.unitPriceCents <= 0);
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.lineTotalCents,
    0,
  );
  const notReady = selected.find(
    ({ product: p, quantity }) =>
      p.availability !== "in-stock" ||
      Number(p.stockAvailable ?? 0) < quantity ||
      p.priceZar <= 0 ||
      productMissingDetails(p).length,
  );
  const freight =
    input.destination.method === "delivery" &&
    selected.some(({ product: p }) => p.details.freightOnly);
  const crossBorder =
    input.destination.country !== "ZA" || sales.dispatchCountry !== "ZA";
  const postcode = input.destination.postcode.toUpperCase().replace(/\s/g, "");
  const zones = sales.zones
    .filter(
      (z) =>
        z.enabled &&
        z.countries.includes(input.destination.country) &&
        (!z.postcodePrefixes.length ||
          z.postcodePrefixes.some((prefix) =>
            postcode.startsWith(prefix.toUpperCase().replace(/\s/g, "")),
          )),
    )
    .sort(
      (a, b) =>
        Math.max(
          0,
          ...b.postcodePrefixes
            .filter((p) =>
              postcode.startsWith(p.toUpperCase().replace(/\s/g, "")),
            )
            .map((p) => p.length),
        ) -
        Math.max(
          0,
          ...a.postcodePrefixes
            .filter((p) =>
              postcode.startsWith(p.toUpperCase().replace(/\s/g, "")),
            )
            .map((p) => p.length),
        ),
    );
  const zone = zones[0];
  let weightKg: number | null = 0;
  for (const { product: p, quantity } of selected) {
    const d = p.details;
    if (d.packedWeightKg === null) {
      weightKg = null;
      break;
    }
    let weight = d.packedWeightKg;
    if (zone?.volumetricDivisor) {
      if (!d.packedLengthCm || !d.packedWidthCm || !d.packedHeightCm) {
        weightKg = null;
        break;
      }
      weight = Math.max(
        weight,
        (d.packedLengthCm * d.packedWidthCm * d.packedHeightCm) /
          zone.volumetricDivisor,
      );
    }
    weightKg += weight * quantity;
  }
  let shippingCents: number | null = null;
  let transitMinDays: number | null = null,
    transitMaxDays: number | null = null;
  let message = "Delivery to this area needs a tailored quote.";
  if (input.destination.method === "collection") {
    if (sales.collectionEnabled) {
      shippingCents = 0;
      transitMinDays = 0;
      transitMaxDays = 0;
      message = "Collect from the store after we confirm your order is ready.";
    } else
      message =
        "Collection is not available. Choose delivery or request a quote.";
  } else if (freight) message = "This order needs a specialist freight quote.";
  else if (
    zone &&
    weightKg !== null &&
    (zone.maxWeightKg === null || weightKg <= zone.maxWeightKg) &&
    zone.baseZar !== null &&
    zone.perKgZar !== null
  ) {
    shippingCents =
      toCents(zone.baseZar) + Math.ceil(weightKg) * toCents(zone.perKgZar);
    transitMinDays = zone.transitMinDays;
    transitMaxDays = zone.transitMaxDays;
    message =
      "Estimated delivery based on your destination and packed shipment weight.";
  } else if (zone && weightKg === null)
    message =
      "We need to confirm packed shipment details before quoting delivery.";
  else if (
    zone &&
    zone.maxWeightKg !== null &&
    weightKg !== null &&
    weightKg > zone.maxWeightKg
  )
    message =
      "This shipment exceeds the standard parcel limit. Request a freight quote.";
  const mins = selected.map(({ product: p }) => p.details.dispatchMinDays),
    maxs = selected.map(({ product: p }) => p.details.dispatchMaxDays);
  const dispatchMinDays = mins.every((v) => v !== null)
    ? Math.max(
        ...(mins as number[]),
        input.destination.method === "collection"
          ? sales.collectionLeadDays
          : 0,
      )
    : null;
  const dispatchMaxDays = maxs.every((v) => v !== null)
    ? Math.max(
        ...(maxs as number[]),
        input.destination.method === "collection"
          ? sales.collectionLeadDays
          : 0,
      )
    : null;
  if (notReady)
    message =
      "Availability or product details need confirmation. Request a quote and we will help.";
  else if (crossBorder)
    message =
      "SADC delivery is available by quotation. We will confirm delivery charges and payment options.";
  else if (!sales.checkoutEnabled)
    message = "Online checkout is being prepared. You can request a quote now.";
  const totalCents =
    shippingCents === null || priceOnRequest
      ? null
      : subtotalCents + shippingCents;
  const taxIncludedCents =
    totalCents === null
      ? 0
      : Math.round(
          totalCents - totalCents / (1 + sales.vatIncludedPercent / 100),
        );
  return {
    items,
    subtotalCents,
    priceOnRequest,
    shippingCents,
    totalCents,
    taxIncludedCents,
    payable:
      !notReady &&
      !freight &&
      !crossBorder &&
      sales.checkoutEnabled &&
      shippingCents !== null,
    deliveryEstimated: shippingCents !== null,
    crossBorder,
    message,
    zoneName:
      input.destination.method === "collection"
        ? "Store collection"
        : (zone?.name ?? null),
    weightKg,
    dispatchMinDays,
    dispatchMaxDays,
    transitMinDays,
    transitMaxDays,
    arrivalMin:
      !notReady &&
      !crossBorder &&
      shippingCents !== null &&
      dispatchMinDays !== null &&
      transitMinDays !== null
        ? workdays(now, dispatchMinDays + transitMinDays)
        : null,
    arrivalMax:
      !notReady &&
      !crossBorder &&
      shippingCents !== null &&
      dispatchMaxDays !== null &&
      transitMaxDays !== null
        ? workdays(now, dispatchMaxDays + transitMaxDays)
        : null,
    notes: sales.deliveryNotes,
  };
}
