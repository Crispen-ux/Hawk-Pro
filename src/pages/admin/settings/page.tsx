import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import { Form } from "@/components/ui/form.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import TextField from "@/components/forms/text-field.tsx";
import { useSiteSettings } from "@/hooks/use-settings.tsx";
import {
  settingsSchema,
  type SettingsInput,
} from "../../../../db/validation.ts";
import { saveSettings } from "@/lib/api.ts";

export default function AdminSettings() {
  const { settings, apply } = useSiteSettings();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  // Prefill once the provider has read the stored values, but never over a
  // form the admin has already started editing.
  useEffect(() => {
    if (form.formState.isDirty) return;
    form.reset(settings);
  }, [form, settings]);

  const onSubmit = async (values: SettingsInput) => {
    setSaving(true);
    setError("");
    try {
      const saved = await saveSettings(values);
      apply(saved);
      toast.success("Site settings saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 lg:px-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
          Site
        </p>
        <h1 className="font-serif text-5xl font-extrabold uppercase leading-none">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          The announcement banner and the contact details in the footer read
          from these values.
        </p>
      </header>

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Settings not saved</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          <section className="space-y-5 border bg-card p-5">
            <h2 className="font-serif text-xl font-bold uppercase tracking-wide">
              Announcement banner
            </h2>
            <TextField
              control={form.control}
              name="announcement"
              label="Banner text"
              placeholder="Engineered for Sound. Built for Performance."
              hint="Shown at the top of every page, up to 160 characters."
            />
          </section>

          <section className="space-y-5 border bg-card p-5">
            <h2 className="font-serif text-xl font-bold uppercase tracking-wide">
              Contact details
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                control={form.control}
                name="contact.email"
                label="Email"
                type="email"
                placeholder="hello@hawk.co.za"
              />
              <TextField
                control={form.control}
                name="contact.phone"
                label="Phone"
                type="tel"
                placeholder="+27 (0)11 000 0000"
              />
            </div>
            <TextField
              control={form.control}
              name="contact.address"
              label="Address"
              placeholder="Street, suburb, city"
            />
            <TextField
              control={form.control}
              name="contact.hours"
              label="Trading hours"
              placeholder="Mon–Fri 08:00–17:00"
            />
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg" disabled={saving}>
              {saving ? "Saving…" : "Save settings"}
            </Button>
            {form.formState.isDirty && (
              <span className="text-sm text-muted-foreground">
                Unsaved changes
              </span>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
