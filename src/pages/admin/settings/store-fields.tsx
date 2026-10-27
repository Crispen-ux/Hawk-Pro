import type { Control } from "react-hook-form";
import TextField from "@/components/forms/text-field";
import type { SettingsInput } from "../../../../db/validation";
export function StoreFields({
  control,
  section,
}: {
  control: Control<SettingsInput>;
  section: "identity" | "contact" | "hours";
}) {
  if (section === "identity")
    return (
      <div className="space-y-5">
        <TextField
          control={control}
          name="store.name"
          label="Store name"
          placeholder="HAWK"
        />
        <TextField
          control={control}
          name="store.tagline"
          label="Store description"
          multiline
          hint="Displayed beneath the logo in your storefront footer."
        />
      </div>
    );
  if (section === "contact")
    return (
      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            control={control}
            name="contact.email"
            label="Customer support email"
            type="email"
            placeholder="hello@your-store.co.za"
          />
          <TextField
            control={control}
            name="contact.phone"
            label="Customer support phone"
            type="tel"
            placeholder="+27 11 123 4567"
          />
        </div>
        <TextField
          control={control}
          name="contact.address"
          label="Store address"
          multiline
          placeholder="Street, suburb, city, postal code"
        />
      </div>
    );
  return (
    <div className="space-y-5">
      <TextField
        control={control}
        name="contact.hours"
        label="Trading hours"
        multiline
        placeholder={
          "Monday–Friday: 08:00–17:00\nSaturday: 09:00–13:00\nSunday & public holidays: Closed"
        }
        hint="Enter one line per day or group of days. These hours are displayed to customers."
      />
      <TextField
        control={control}
        name="announcement"
        label="Storefront announcement"
        placeholder="Engineered for Sound. Built for Performance."
        hint="The announcement bar at the top of the storefront. Maximum 160 characters."
      />
    </div>
  );
}
