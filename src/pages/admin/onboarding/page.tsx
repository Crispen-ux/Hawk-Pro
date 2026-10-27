import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, type FieldPath } from "react-hook-form";
import {
  Store,
  Phone,
  Clock,
  Check,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useSiteSettings } from "@/hooks/use-settings";
import { saveSettings } from "@/lib/api";
import {
  DEFAULT_SETTINGS,
  settingsSchema,
  type SettingsInput,
} from "../../../../db/validation";
import { StoreFields } from "../settings/store-fields";
import StorePreview from "../settings/store-preview";
const steps = [
  {
    title: "Store identity",
    icon: Store,
    description: "Introduce your store with a name and a short description.",
    section: "identity",
    fields: ["store.name", "store.tagline"],
  },
  {
    title: "Contact & location",
    icon: Phone,
    description: "Give customers the right details to reach your team.",
    section: "contact",
    fields: ["contact.email", "contact.phone", "contact.address"],
  },
  {
    title: "Hours & announcement",
    icon: Clock,
    description: "Let customers know when you are open and what is new.",
    section: "hours",
    fields: ["contact.hours", "announcement"],
  },
  {
    title: "Review & finish",
    icon: Check,
    description: "Check the customer-facing details before completing setup.",
    section: "hours",
    fields: [],
  },
] as const;
export default function StoreOnboarding() {
  const state = useSiteSettings();
  if (!state.ready)
    return (
      <p className="p-8" role="status">
        Loading store setup…
      </p>
    );
  if (state.error)
    return (
      <div className="m-8 admin-panel space-y-4" role="alert">
        <h1>Store setup unavailable</h1>
        <p>{state.error}</p>
        <Button onClick={state.refresh}>Retry</Button>
      </div>
    );
  return <SetupWizard />;
}
function SetupWizard() {
  const { settings, apply } = useSiteSettings();
  const navigate = useNavigate();
  const [step, setStep] = useState(
    settings.onboardingCompleted ? 0 : settings.onboardingStep,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const initial = { ...settings, contact: { ...settings.contact } };
  for (const key of ["email", "phone", "address", "hours"] as const) {
    if (initial.contact[key] === DEFAULT_SETTINGS.contact[key])
      initial.contact[key] = "";
  }
  const form = useForm<SettingsInput>({ defaultValues: initial });
  const preview = form.watch();
  async function next() {
    setError("");
    form.clearErrors();
    const values = form.getValues();
    const current = steps[step];
    for (const path of current.fields) {
      const value =
        path === "announcement"
          ? values.announcement
          : path.startsWith("store.")
            ? values.store[path.slice(6) as keyof SettingsInput["store"]]
            : values.contact[path.slice(8) as keyof SettingsInput["contact"]];
      if (!value?.trim()) {
        form.setError(path as FieldPath<SettingsInput>, {
          message: "This field is required",
        });
        return;
      }
    }
    let payload: SettingsInput =
      step === 0
        ? { ...settings, store: values.store }
        : step === 1
          ? {
              ...settings,
              contact: {
                ...settings.contact,
                email: values.contact.email,
                phone: values.contact.phone,
                address: values.contact.address,
              },
            }
          : step === 2
            ? {
                ...settings,
                contact: { ...settings.contact, hours: values.contact.hours },
                announcement: values.announcement,
              }
            : { ...values, onboardingCompleted: true };
    payload = { ...payload, onboardingStep: Math.min(step + 1, 3) };
    const parsed = settingsSchema.safeParse(payload);
    if (!parsed.success) {
      for (const issue of parsed.error.issues)
        form.setError(issue.path.join(".") as FieldPath<SettingsInput>, {
          message: issue.message,
        });
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      const saved = await saveSettings(parsed.data);
      apply(saved);
      if (step === 3) navigate("/admin", { replace: true });
      else setStep(step + 1);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Setup could not be saved. Your current entries are still here.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="max-w-6xl mx-auto p-5 lg:p-10 space-y-8">
      <header className="admin-brand-panel px-6 py-8 lg:p-10">
        <p className="text-primary text-xs uppercase tracking-[.3em] mb-4">
          HAWK / Store setup
        </p>
        <h1 className="text-white">Build your store. Turn it up.</h1>
        <p className="text-white/70 mt-4 max-w-xl">
          Set up your store details once. Keep your storefront and
          administration in sync.
        </p>
      </header>
      <ol
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        aria-label="Store setup progress"
      >
        {steps.map((item, index) => (
          <li
            key={item.title}
            aria-current={step === index ? "step" : undefined}
            className={
              "border p-4 flex items-center gap-3 " +
              (step === index
                ? "border-primary bg-primary/10"
                : "bg-card text-muted-foreground")
            }
          >
            <item.icon
              size={19}
              className={step === index ? "text-primary" : ""}
            />
            <div>
              <p className="text-[10px] uppercase tracking-widest">
                Step {index + 1}
              </p>
              <p className="text-sm font-semibold">{item.title}</p>
            </div>
            {index < step && (
              <Check className="ml-auto text-primary" size={16} />
            )}
          </li>
        ))}
      </ol>
      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-7 items-start">
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void next();
            }}
            className="admin-panel space-y-6"
            noValidate
          >
            <div className="border-b pb-5">
              <p className="text-primary text-xs uppercase tracking-widest mb-2">
                Step {step + 1} of 4
              </p>
              <h2>{steps[step].title}</h2>
              <p className="text-muted-foreground text-sm mt-2">
                {steps[step].description}
              </p>
            </div>
            {step < 3 ? (
              <StoreFields
                control={form.control}
                section={steps[step].section}
              />
            ) : (
              <div className="space-y-4 text-sm">
                <p>These details will appear on your storefront:</p>
                <dl className="space-y-3">
                  {[
                    ["Store", preview.store.name],
                    ["Email", preview.contact.email],
                    ["Phone", preview.contact.phone],
                    ["Address", preview.contact.address],
                    ["Trading hours", preview.contact.hours],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="grid sm:grid-cols-[110px_1fr] gap-2 border-b pb-3"
                    >
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="whitespace-pre-line break-words">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="text-muted-foreground">
                  You can edit any of these details later in Store settings.
                </p>
              </div>
            )}
            {error && (
              <p
                role="alert"
                className="text-destructive border border-destructive p-3 text-sm"
              >
                {error}
              </p>
            )}
            <div className="flex flex-wrap justify-between gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                disabled={step === 0 || busy}
                onClick={() => {
                  setError("");
                  setStep(step - 1);
                }}
              >
                <ArrowLeft size={16} />
                Back
              </Button>
              <Button type="submit" disabled={busy}>
                {busy
                  ? "Saving…"
                  : step === 3
                    ? "Complete store setup"
                    : "Save & continue"}
                <ArrowRight size={16} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Progress is saved to your store after each step.
            </p>
          </form>
        </Form>
        <StorePreview settings={preview} />
      </div>
    </div>
  );
}
