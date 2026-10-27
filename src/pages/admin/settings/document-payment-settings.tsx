import { useEffect, useState } from "react";
import { request } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_DOCUMENT_PAYMENTS,
  documentPaymentsSchema,
  type DocumentPayments,
} from "../../../../db/document-payments-validation";
const fields = [
  ["bankName", "Bank name"],
  ["accountHolder", "Account holder"],
  ["accountNumber", "Account number"],
  ["accountType", "Account type"],
  ["branchCode", "Branch code"],
  ["swiftCode", "SWIFT / BIC (optional)"],
] as const;
export default function DocumentPaymentSettings() {
  const [value, setValue] = useState<DocumentPayments>(
    DEFAULT_DOCUMENT_PAYMENTS,
  );
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    request<{ payments: DocumentPayments }>(
      "/api/settings?section=document-payments",
      { admin: true },
    )
      .then((result) => {
        if (active) {
          setValue(result.payments);
          setReady(true);
          setError("");
        }
      })
      .catch((error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  const change = (key: keyof DocumentPayments, next: string | boolean) => {
    setValue((previous) => ({ ...previous, [key]: next }));
    setSaved(false);
  };
  async function save(event: React.FormEvent) {
    event.preventDefault();
    const parsed = documentPaymentsSchema.safeParse(value);
    if (!parsed.success) {
      setError(
        parsed.error.issues
          .map((issue) => issue.path.join(".") + ": " + issue.message)
          .join(". "),
      );
      return;
    }
    setSaving(true);
    setError("");
    try {
      const result = await request<{ payments: DocumentPayments }>(
        "/api/settings?section=document-payments",
        { method: "PUT", admin: true, body: parsed.data },
      );
      setValue(result.payments);
      setSaved(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not save payment details",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="admin-panel space-y-4">
      <h2>Quote & invoice payment details</h2>
      <p className="text-sm text-muted-foreground">
        Set up bank transfer and cash instructions for documents created from
        Orders. These settings are available to administrators only and are
        saved separately below.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!ready && !error ? (
        <p role="status" className="text-sm text-muted-foreground">
          Loading payment details…
        </p>
      ) : !ready ? (
        <Button
          variant="outline"
          onClick={() => setAttempt((value) => value + 1)}
        >
          Retry loading payment details
        </Button>
      ) : (
        <form onSubmit={save} className="space-y-4">
          <fieldset disabled={saving} className="space-y-4">
            <label className="flex gap-2 items-center text-sm font-medium">
              <input
                type="checkbox"
                checked={value.bankEnabled}
                onChange={(e) => change("bankEnabled", e.target.checked)}
              />
              Offer bank transfer
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map(([key, label]) => (
                <label key={key} className="text-sm">
                  {label}
                  <Input
                    value={value[key]}
                    maxLength={
                      key === "accountNumber"
                        ? 60
                        : key === "branchCode" || key === "swiftCode"
                          ? 40
                          : key === "accountType"
                            ? 80
                            : 160
                    }
                    onChange={(e) => change(key, e.target.value)}
                  />
                </label>
              ))}
            </div>
            <label className="block text-sm">
              Bank transfer instructions
              <textarea
                className="mt-1 block min-h-20 w-full border bg-background p-2"
                maxLength={1000}
                value={value.bankInstructions}
                onChange={(e) => change("bankInstructions", e.target.value)}
                placeholder="When payment is due and where to send proof of payment"
              />
            </label>
            <label className="flex gap-2 items-center text-sm font-medium">
              <input
                type="checkbox"
                checked={value.cashEnabled}
                onChange={(e) => change("cashEnabled", e.target.checked)}
              />
              Offer cash payment
            </label>
            <label className="block text-sm">
              Cash payment instructions
              <textarea
                className="mt-1 block min-h-20 w-full border bg-background p-2"
                maxLength={1000}
                value={value.cashInstructions}
                onChange={(e) => change("cashInstructions", e.target.value)}
                placeholder="Where and when customers may pay cash"
              />
            </label>
            <label className="block text-sm">
              Quote / invoice terms (optional)
              <textarea
                className="mt-1 block min-h-20 w-full border bg-background p-2"
                maxLength={1500}
                value={value.terms}
                onChange={(e) => change("terms", e.target.value)}
              />
            </label>
            <Button type="submit">
              {saving ? "Saving…" : "Save payment details"}
            </Button>
          </fieldset>
          {saved && (
            <p role="status" className="text-sm text-primary">
              Payment details saved.
            </p>
          )}
        </form>
      )}
    </section>
  );
}
