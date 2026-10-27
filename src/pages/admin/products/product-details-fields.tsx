import type { ProductDetails } from "../../../../db/product-details";
import { SOLD_AS_LABEL } from "../../../../db/product-details";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
export default function ProductDetailsFields({
  value,
  onChange,
}: {
  value: ProductDetails;
  onChange: (value: ProductDetails) => void;
}) {
  const edit = <K extends keyof ProductDetails>(
    key: K,
    next: ProductDetails[K],
  ) => onChange({ ...value, [key]: next });
  const numbers = [
    ["continuousWatts", "Continuous / RMS power (W)"],
    ["impedanceOhms", "Impedance (ohms)"],
    ["weightKg", "Product weight (kg)"],
    ["packedWeightKg", "Packed shipment weight (kg)"],
    ["packedLengthCm", "Packed length (cm)"],
    ["packedWidthCm", "Packed width (cm)"],
    ["packedHeightCm", "Packed height (cm)"],
    ["dispatchMinDays", "Minimum dispatch lead time (working days)"],
    ["dispatchMaxDays", "Maximum dispatch lead time (working days)"],
  ] as const;
  return (
    <section className="border bg-card p-5 space-y-6">
      <header>
        <h2 className="font-serif text-xl font-bold uppercase">
          Speaker details & shipping
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Enter verified product information. Unknown values stay blank; they
          will never be invented on the storefront. Pack size, box contents and
          dispatch time are required for online purchases.
        </p>
      </header>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm space-y-2">
          SKU / model code
          <Input
            value={value.sku}
            onChange={(e) => edit("sku", e.target.value)}
          />
        </label>
        <label className="text-sm space-y-2">
          Sold as
          <select
            className="w-full border bg-background p-2"
            value={value.soldAs}
            onChange={(e) =>
              edit("soldAs", e.target.value as ProductDetails["soldAs"])
            }
          >
            {Object.entries(SOLD_AS_LABEL).map(([key, label]) => (
              <option value={key} key={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm space-y-2">
          Speaker type
          <select
            className="w-full border bg-background p-2"
            value={value.speakerType}
            onChange={(e) =>
              edit(
                "speakerType",
                e.target.value as ProductDetails["speakerType"],
              )
            }
          >
            <option value="unspecified">Not specified</option>
            <option value="active">Active / powered</option>
            <option value="passive">Passive / amplifier required</option>
            <option value="not-applicable">Not applicable</option>
          </select>
        </label>
        <label className="text-sm space-y-2">
          Frequency response
          <Input
            value={value.frequencyResponse}
            onChange={(e) => edit("frequencyResponse", e.target.value)}
            placeholder="Use the manufacturer's published value"
          />
        </label>
        {numbers.map(([key, label]) => (
          <label key={key} className="text-sm space-y-2">
            {label}
            <Input
              type="number"
              min={key.startsWith("dispatch") ? 0 : 0.001}
              step={key.startsWith("dispatch") ? 1 : "any"}
              value={value[key] ?? ""}
              onChange={(e) =>
                edit(key, e.target.value === "" ? null : Number(e.target.value))
              }
            />
          </label>
        ))}
        <label className="text-sm space-y-2 sm:col-span-2">
          Product dimensions
          <Input
            value={value.dimensions}
            onChange={(e) => edit("dimensions", e.target.value)}
            placeholder="Width × height × depth, with units"
          />
        </label>
        <label className="text-sm space-y-2 sm:col-span-2">
          Inputs / outputs / connections
          <Textarea
            value={value.connections}
            onChange={(e) => edit("connections", e.target.value)}
          />
        </label>
        <label className="text-sm space-y-2 sm:col-span-2">
          What is included in the box
          <Textarea
            value={value.included}
            onChange={(e) => edit("included", e.target.value)}
            placeholder="List every included speaker, cable, accessory or document"
          />
        </label>
        <label className="text-sm space-y-2 sm:col-span-2">
          Product warranty details
          <Textarea
            value={value.warranty}
            onChange={(e) => edit("warranty", e.target.value)}
            placeholder="Your actual warranty coverage and how customers claim"
          />
        </label>
      </div>
      <label className="flex gap-3 items-center text-sm">
        <input
          type="checkbox"
          checked={value.freightOnly}
          onChange={(e) => edit("freightOnly", e.target.checked)}
        />
        Specialist freight only — always request a delivery quote
      </label>
    </section>
  );
}
