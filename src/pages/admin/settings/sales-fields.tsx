import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SettingsInput } from "../../../../db/validation";
import { SADC_COUNTRIES } from "../../../../db/sales-validation";
export default function SalesFields({
  form,
}: {
  form: UseFormReturn<SettingsInput>;
}) {
  const sales = useWatch({ control: form.control, name: "sales" });
  const zones = useFieldArray({
    control: form.control,
    name: "sales.zones",
    keyName: "formKey",
  });
  return (
    <section className="admin-panel space-y-6">
      <div className="border-b pb-4">
        <h2>Delivery & guest checkout</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Payflex checkout is available for South African orders. Other SADC
          destinations use a guest quote request. Rates below are your own
          delivery rules, not live courier quotes.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <label className="text-sm space-y-2">
          Dispatch country
          <select
            className="w-full border bg-background p-2"
            {...form.register("sales.dispatchCountry")}
          >
            {SADC_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm space-y-2">
          VAT already included in product and delivery prices (%)
          <Input
            type="number"
            min="0"
            max="100"
            step="any"
            {...form.register("sales.vatIncludedPercent", {
              valueAsNumber: true,
            })}
          />
        </label>
      </div>
      {!form.watch("onboardingCompleted") && (
        <p className="text-sm text-muted-foreground">
          Complete Store setup before enabling online payment.
        </p>
      )}
      <label className="flex gap-3 items-center text-sm">
        <input
          type="checkbox"
          {...form.register("sales.checkoutEnabled")}
          disabled={!form.watch("onboardingCompleted")}
        />
        Enable guest checkout with Payflex (requires server credentials and
        HTTPS callbacks)
      </label>
      <label className="flex gap-3 items-center text-sm">
        <input type="checkbox" {...form.register("sales.collectionEnabled")} />
        Offer collection from the store address
      </label>
      {sales.collectionEnabled && (
        <label className="block text-sm space-y-2">
          Collection preparation time (working days)
          <Input
            type="number"
            min="0"
            {...form.register("sales.collectionLeadDays", {
              valueAsNumber: true,
            })}
          />
        </label>
      )}
      <div className="flex justify-between items-center gap-3 border-t pt-5">
        <h3>Delivery zones</h3>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            zones.append({
              id: crypto.randomUUID(),
              name: "New delivery zone",
              enabled: false,
              countries: ["ZA"],
              postcodePrefixes: [],
              baseZar: null,
              perKgZar: null,
              maxWeightKg: null,
              volumetricDivisor: null,
              transitMinDays: null,
              transitMaxDays: null,
            })
          }
        >
          <Plus size={15} />
          Add zone
        </Button>
      </div>
      {!zones.fields.length && (
        <p className="text-sm text-muted-foreground border border-dashed p-4">
          No delivery prices are published yet. Add your agreed courier rates
          and transit times. Destinations without a matching zone request a
          quote.
        </p>
      )}
      {zones.fields.map((field, index) => {
        const zone = sales.zones[index];
        return (
          <fieldset key={field.formKey} className="border p-4 space-y-4">
            <legend className="px-2 font-semibold text-sm">{zone.name}</legend>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  {...form.register(`sales.zones.${index}.enabled`)}
                />
                Publish this zone
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => zones.remove(index)}
              >
                <Trash2 size={15} />
                Remove
              </Button>
            </div>
            <label className="block text-sm space-y-2">
              Zone name
              <Input {...form.register(`sales.zones.${index}.name`)} />
            </label>
            <div>
              <p className="text-sm mb-2">Countries covered</p>
              <div className="grid grid-cols-2 gap-2">
                {SADC_COUNTRIES.map((country) => (
                  <label
                    key={country.code}
                    className="flex gap-2 items-center text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={zone.countries.includes(country.code)}
                      onChange={(e) =>
                        form.setValue(
                          `sales.zones.${index}.countries`,
                          e.target.checked
                            ? [...zone.countries, country.code]
                            : zone.countries.filter((c) => c !== country.code),
                          { shouldDirty: true },
                        )
                      }
                    />
                    {country.name}
                  </label>
                ))}
              </div>
            </div>
            <label className="block text-sm space-y-2">
              Postcode prefixes (optional, comma-separated)
              <Input
                defaultValue={zone.postcodePrefixes.join(", ")}
                onBlur={(e) =>
                  form.setValue(
                    `sales.zones.${index}.postcodePrefixes`,
                    e.target.value
                      .split(",")
                      .map((p) => p.trim().toUpperCase())
                      .filter(Boolean),
                    { shouldDirty: true },
                  )
                }
                placeholder="Leave blank to cover the whole country"
              />
            </label>
            <div className="grid sm:grid-cols-2 gap-4">
              {(
                [
                  ["baseZar", "Base delivery fee (ZAR)"],
                  ["perKgZar", "Additional fee per rounded-up kg (ZAR)"],
                  ["maxWeightKg", "Maximum shipment weight (kg, optional)"],
                  [
                    "volumetricDivisor",
                    "Courier volumetric divisor (optional)",
                  ],
                  ["transitMinDays", "Minimum transit time (working days)"],
                  ["transitMaxDays", "Maximum transit time (working days)"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block text-sm space-y-2">
                  {label}
                  <Input
                    type="number"
                    step={key.includes("Days") ? 1 : "any"}
                    min={key === "baseZar" || key === "perKgZar" ? 0 : 1}
                    value={zone[key] ?? ""}
                    onChange={(e) =>
                      form.setValue(
                        `sales.zones.${index}.${key}`,
                        e.target.value === "" ? null : Number(e.target.value),
                        { shouldDirty: true },
                      )
                    }
                  />
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Charge = base fee + rounded-up billable kg × per-kg fee. The
              longest matching postcode prefix wins. If a volumetric divisor is
              configured, packed dimensions are required.
            </p>
          </fieldset>
        );
      })}
      <label className="block text-sm space-y-2">
        Delivery notes / cross-border charges
        <Textarea
          {...form.register("sales.deliveryNotes")}
          placeholder="Your actual delivery conditions, destination duties and collection instructions"
        />
      </label>
      <label className="block text-sm space-y-2">
        Returns and delivery-damage policy
        <Textarea
          rows={5}
          {...form.register("sales.returnsPolicy")}
          placeholder="Your actual returns process, eligibility and contact instructions"
        />
      </label>
      {form.formState.errors.sales && (
        <p className="text-destructive text-sm" role="alert">
          {form.formState.errors.sales.deliveryNotes?.message ||
            form.formState.errors.sales.returnsPolicy?.message ||
            form.formState.errors.sales.checkoutEnabled?.message ||
            "Check delivery zone rates, country coverage and transit times."}{" "}
          Enabled zones need complete values and cannot overlap at the same
          postcode specificity.
        </p>
      )}
    </section>
  );
}
