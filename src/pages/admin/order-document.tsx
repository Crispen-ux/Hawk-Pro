import { useEffect, useState } from "react";
import { FileText, Printer } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { request } from "@/lib/api";
import {
  renderOrderDocument,
  type DocumentKind,
  type DocumentMethod,
} from "@/lib/order-document";
import type { CommerceRecord } from "../../../db/commerce-validation";
import type { SettingsInput } from "../../../db/validation";
import type { DocumentPayments } from "../../../db/document-payments-validation";
export default function OrderDocument({ order }: { order: CommerceRecord }) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<{
    settings: SettingsInput;
    payments: DocumentPayments;
  } | null>(null);
  const [error, setError] = useState("");
  const [kind, setKind] = useState<DocumentKind>("quote");
  const [method, setMethod] = useState<DocumentMethod>("none");
  const [html, setHtml] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!open) return;
    let active = true;
    Promise.all([
      request<{ settings: SettingsInput }>("/api/settings"),
      request<{ payments: DocumentPayments }>(
        "/api/settings?section=document-payments",
        { admin: true },
      ),
    ])
      .then(([site, payment]) => {
        if (active)
          setConfig({ settings: site.settings, payments: payment.payments });
      })
      .catch((error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [open, attempt]);
  function preview() {
    if (!config) return;
    try {
      setHtml(
        renderOrderDocument(
          order,
          config.settings,
          config.payments,
          kind,
          method,
          new URL("/brand/hawk-black.png", window.location.origin).href,
        ),
      );
      setError("");
    } catch (error) {
      setHtml("");
      setError(
        error instanceof Error ? error.message : "Could not create document",
      );
    }
  }
  function print() {
    const tab = window.open("", "_blank");
    if (!tab) {
      setError("Allow pop-ups to open your printable document.");
      return;
    }
    tab.opener = null;
    tab.document.open();
    tab.document.write(html);
    tab.document.close();
    tab.document
      .getElementById("print-document")
      ?.addEventListener("click", () => tab.print());
  }
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setConfig(null);
          setError("");
          setHtml("");
          setMethod(
            (order.data.documentPaymentMethod as DocumentMethod) || "none",
          );
          setOpen(true);
        }}
        aria-label={"Quote or invoice for " + String(order.data.name)}
      >
        <FileText size={14} />
        Quote / invoice
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="admin-theme max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create quote or invoice</DialogTitle>
            <DialogDescription>
              Preview the current saved order, then open the document to print
              or save as PDF. Payment status changes must be saved separately in
              Orders. Each preview uses your current saved banking details.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {!config ? (
            <div>
              <p role="status">Loading document settings…</p>
              {error && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setError("");
                    setAttempt((value) => value + 1);
                  }}
                >
                  Retry
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm">
                  Document type
                  <select
                    className="mt-1 block w-full border bg-background p-2"
                    value={kind}
                    onChange={(e) => {
                      setKind(e.target.value as DocumentKind);
                      setHtml("");
                    }}
                  >
                    <option value="quote">Quotation</option>
                    <option value="invoice">Invoice</option>
                  </select>
                </label>
                <label className="text-sm">
                  Payment options
                  <select
                    className="mt-1 block w-full border bg-background p-2"
                    disabled={order.data.paymentProvider === "payflex"}
                    value={method}
                    onChange={(e) => {
                      setMethod(e.target.value as DocumentMethod);
                      setHtml("");
                    }}
                  >
                    <option value="none">
                      No offline payment instructions
                    </option>
                    <option value="bank-transfer">Bank transfer</option>
                    <option value="cash">Cash</option>
                    <option value="bank-transfer-or-cash">
                      Bank transfer or cash
                    </option>
                  </select>
                </label>
              </div>
              <p className="text-sm text-muted-foreground">
                Configure bank accounts, cash instructions and terms in{" "}
                <Link to="/admin/settings" className="underline">
                  Store settings
                </Link>
                . Payflex orders retain their Payflex payment instructions.
              </p>
              <div className="flex gap-2">
                <Button onClick={preview}>Preview document</Button>
                {html && (
                  <Button variant="outline" onClick={print}>
                    <Printer size={16} />
                    Open printable document
                  </Button>
                )}
              </div>
              {html && (
                <iframe
                  title="Quote or invoice preview"
                  srcDoc={html}
                  sandbox=""
                  className="h-[60vh] w-full border bg-white"
                />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
