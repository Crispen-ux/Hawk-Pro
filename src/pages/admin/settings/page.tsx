import DocumentPaymentSettings from "./document-payment-settings";
import SalesFields from "./sales-fields";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Save, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useSiteSettings } from "@/hooks/use-settings";
import { settingsSchema, type SettingsInput } from "../../../../db/validation";
import { saveSettings } from "@/lib/api";
import { StoreFields } from "./store-fields";
import StorePreview from "./store-preview";
export default function AdminSettings() {
  const {
    settings,
    ready,
    error: loadError,
    refresh,
    apply,
  } = useSiteSettings();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema) as Resolver<SettingsInput>,
    defaultValues: settings,
  });
  useEffect(() => {
    if (!form.formState.isDirty) form.reset(settings);
  }, [form, settings]);
  const preview = form.watch();
  async function onSubmit(values: SettingsInput) {
    setSaving(true);
    setError("");
    try {
      const saved = await saveSettings(values);
      apply(saved);
      form.reset(saved);
      toast.success("Store details updated on the storefront");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Settings could not be saved");
    } finally {
      setSaving(false);
    }
  }
  if (!ready)
    return (
      <p className="p-8" role="status">
        Loading your store settings…
      </p>
    );
  if (loadError)
    return (
      <div className="m-8 admin-panel space-y-4" role="alert">
        <h1>Store settings unavailable</h1>
        <p>{loadError}</p>
        <Button onClick={refresh}>Retry loading settings</Button>
      </div>
    );
  return (
    <div className="max-w-7xl mx-auto p-5 lg:p-9 space-y-7">
      <header className="flex flex-wrap gap-4 justify-between items-end">
        <div>
          <p className="text-xs uppercase tracking-[.3em] text-primary mb-2">
            Your store / Configuration
          </p>
          <h1>Store settings</h1>
          <p className="text-muted-foreground mt-3">
            Manage the details your customers see, in one place.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/admin/onboarding">
            {settings.onboardingCompleted
              ? "Review store setup"
              : "Continue store setup"}
            <ArrowRight size={16} />
          </Link>
        </Button>
      </header>
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-7 items-start">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
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
            {(
              [
                ["identity", "Store identity"],
                ["contact", "Contact & location"],
                ["hours", "Trading hours & announcement"],
              ] as const
            ).map(([section, title], index) => (
              <section className="admin-panel space-y-5" key={section}>
                <div className="flex gap-3 items-center border-b pb-4">
                  <span className="text-primary font-mono text-xs">
                    0{index + 1}
                  </span>
                  <h2>{title}</h2>
                </div>
                <StoreFields control={form.control} section={section} />
              </section>
            ))}
            <SalesFields form={form} />
            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" size="lg" disabled={saving}>
                <Save size={16} />
                {saving ? "Saving…" : "Save store settings"}
              </Button>
              <span className="text-sm text-muted-foreground">
                {form.formState.isDirty
                  ? "You have unsaved changes"
                  : "All changes saved"}
              </span>
            </div>
          </form>
        </Form>
        <aside className="space-y-4">
          <DocumentPaymentSettings />
          <StorePreview settings={preview} />
          <div className="flex gap-3 text-sm text-muted-foreground p-4 border">
            <CheckCircle2 className="size-5 shrink-0 text-primary" />
            <p>
              Saved changes update the storefront announcement, contact
              information, and footer. Open storefront tabs refresh when
              focused.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
