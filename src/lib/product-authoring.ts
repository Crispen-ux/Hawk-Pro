import type { ProductInput, ProductRecord } from "../../db/validation";
import { normaliseProductDetails } from "../../db/product-details";

export function duplicateProduct(
  source: ProductRecord,
  suffix: string,
): ProductInput {
  return {
    name: source.name.slice(0, 153) + " (copy)",
    slug: source.slug.slice(0, 100).replace(/-+$/, "") + "-copy-" + suffix,
    category: source.category,
    priceZar: source.priceZar,
    shortDescription: source.shortDescription,
    description: source.description,
    availability: "tbc",
    published: false,
    images: [...source.images],
    specs: source.specs.map((spec) => ({ ...spec })),
    details: { ...normaliseProductDetails(source.details), sku: "" },
  };
}

// Assemble copy from entered facts without external services or invented claims.
export function generateProductDescription(
  input: Pick<ProductInput, "name" | "category" | "details" | "specs">,
) {
  const name = input.name.trim();
  if (name.length < 2) throw new Error("Enter a product name first.");
  const details = normaliseProductDetails(input.details);
  const category = {
    speakers: "speaker",
    subwoofers: "subwoofer",
    accessories: "audio accessory",
    systems: "sound system",
  }[input.category];
  const type =
    details.speakerType === "active" || details.speakerType === "passive"
      ? details.speakerType + " "
      : "";
  const pack = {
    unspecified: "",
    single: "Sold individually (1 unit).",
    pair: "Sold as a pair (2 units).",
    set: "Sold as a complete set.",
  }[details.soldAs];
  const summary = (
    name +
    " — " +
    type +
    category +
    "." +
    (pack ? " " + pack : "")
  ).slice(0, 200);
  const facts: string[] = [];
  if (details.continuousWatts)
    facts.push("Continuous power: " + details.continuousWatts + " W");
  if (details.impedanceOhms)
    facts.push("Impedance: " + details.impedanceOhms + " ohms");
  for (const [label, value] of [
    ["Frequency response", details.frequencyResponse],
    ["Connections", details.connections],
    ["Dimensions", details.dimensions],
  ] as const)
    if (value.trim()) facts.push(label + ": " + value.trim());
  if (details.weightKg) facts.push("Weight: " + details.weightKg + " kg");
  for (const spec of input.specs)
    if (spec.label.trim() && spec.value.trim())
      facts.push(spec.label.trim() + ": " + spec.value.trim());
  const productType = type + category;
  const article = /^[aeiou]/i.test(productType) ? "an" : "a";
  const paragraphs = [name + " is " + article + " " + productType + ".", pack];
  if (facts.length)
    paragraphs.push(
      "Product details\n" + facts.map((fact) => "• " + fact).join("\n"),
    );
  if (details.included.trim())
    paragraphs.push("What's included\n" + details.included.trim());
  if (details.warranty.trim())
    paragraphs.push("Warranty\n" + details.warranty.trim());
  return {
    shortDescription: summary,
    description: paragraphs.filter(Boolean).join("\n\n").slice(0, 4000),
  };
}
