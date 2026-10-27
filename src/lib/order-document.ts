import type { CommerceRecord } from "../../db/commerce-validation";
import type { DocumentPayments } from "../../db/document-payments-validation";
import type { SettingsInput } from "../../db/validation";
import { orderItems, toCents } from "../../db/checkout-model";
export type DocumentKind = "quote" | "invoice";
export type DocumentMethod =
  "none" | "bank-transfer" | "cash" | "bank-transfer-or-cash";
export function documentAmounts(data: Record<string, unknown>) {
  const items = orderItems(data);
  const goods =
    typeof data.goodsQuoteZar === "number"
      ? toCents(data.goodsQuoteZar)
      : typeof data.subtotalCents === "number"
        ? data.subtotalCents
        : toCents(Number(data.total ?? 0));
  const shipping =
    typeof data.deliveryQuoteZar === "number"
      ? toCents(data.deliveryQuoteZar)
      : typeof data.shippingCents === "number"
        ? data.shippingCents
        : data.source === "storefront"
          ? null
          : 0;
  const goodsUnknown =
    data.source === "storefront" &&
    items.some((item) => item.unitPriceCents <= 0) &&
    typeof data.goodsQuoteZar !== "number";
  return {
    goods: goodsUnknown ? null : goods,
    shipping,
    total: goodsUnknown || shipping === null ? null : goods + shipping,
  };
}
const escape = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
const money = (cents: number | null) =>
  cents === null
    ? "To be confirmed"
    : new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: "ZAR",
      }).format(cents / 100);
export function renderOrderDocument(
  order: CommerceRecord,
  settings: SettingsInput,
  payments: DocumentPayments,
  kind: DocumentKind,
  method: DocumentMethod,
  logoUrl: string,
) {
  const data = order.data;
  const amounts = documentAmounts(data);
  if (
    kind === "invoice" &&
    (amounts.total === null || !Number.isFinite(amounts.total))
  )
    throw new Error(
      "Confirm goods pricing and delivery charges in Orders before creating an invoice.",
    );
  const payflex = data.paymentProvider === "payflex";
  const bank =
    !payflex && ["bank-transfer", "bank-transfer-or-cash"].includes(method);
  const cash = !payflex && ["cash", "bank-transfer-or-cash"].includes(method);
  if (bank && !payments.bankEnabled)
    throw new Error("Enable and save banking details in Store settings first.");
  if (cash && !payments.cashEnabled)
    throw new Error(
      "Enable and save cash instructions in Store settings first.",
    );
  const reference = String(data.paymentReference || order.id);
  const title = kind === "quote" ? "Quotation" : "Invoice";
  const lines = orderItems(data)
    .map(
      (item) =>
        "<tr><td>" +
        escape(item.name || data.productName || "Product") +
        (item.packLabel
          ? "<small>" + escape(item.packLabel) + "</small>"
          : "") +
        "</td><td>" +
        escape(item.quantity) +
        "</td></tr>",
    )
    .join("");
  const fact = (label: string, value: unknown) =>
    '<div class="fact"><span>' +
    escape(label) +
    "</span><strong>" +
    escape(value) +
    "</strong></div>";
  const paymentHtml = payflex
    ? "<p>Payment via Payflex. Payment status: " +
      escape(data.payment) +
      ". Please refer to your Payflex payment arrangement.</p>"
    : (bank
        ? "<h3>Bank transfer</h3>" +
          fact("Bank", payments.bankName) +
          fact("Account holder", payments.accountHolder) +
          fact("Account number", payments.accountNumber) +
          fact("Account type", payments.accountType) +
          fact("Branch code", payments.branchCode) +
          (payments.swiftCode ? fact("SWIFT / BIC", payments.swiftCode) : "") +
          fact("Payment reference", reference) +
          '<p class="pre">' +
          escape(payments.bankInstructions) +
          "</p>"
        : "") +
      (cash
        ? '<h3>Cash payment</h3><p class="pre">' +
          escape(payments.cashInstructions) +
          "</p>"
        : "");
  return (
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
    title +
    " " +
    escape(order.id) +
    '</title><style>body{margin:0;background:#f3f1ee;color:#171717;font:14px Arial,sans-serif;line-height:1.5}main{max-width:800px;margin:28px auto;background:white;padding:40px}header{display:flex;align-items:center;justify-content:space-between;border-bottom:4px solid #ff6600;padding-bottom:24px}img{width:120px;height:76px;object-fit:contain}h1{margin:0;text-transform:uppercase;font-size:32px}h2{font-size:18px;margin-top:28px}h3{font-size:15px;margin-top:22px}.muted,small{color:#666}small{display:block}.pre{white-space:pre-line;overflow-wrap:anywhere}.reference{font-size:12px;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{text-align:left;padding:12px;border-bottom:1px solid #ddd}th{background:#f5f3f0}td:last-child,th:last-child{text-align:right}.totals{max-width:360px;margin:22px 0 24px auto}.fact{display:flex;justify-content:space-between;gap:20px;padding:5px 0;overflow-wrap:anywhere}.fact strong{text-align:right}.total{border-top:2px solid #171717;margin-top:10px;padding-top:12px;font-size:18px}.payment{border:1px solid #ddd;padding:0 20px 16px}.footer{border-top:1px solid #ddd;margin-top:28px;padding-top:16px;color:#666;font-size:12px}button{border:0;background:#ff6600;padding:12px 18px;font-weight:bold;cursor:pointer}.toolbar{max-width:880px;margin:20px auto} @media print{body{background:white}main{margin:0;padding:15px;max-width:none}.toolbar{display:none}header,.payment,.totals{break-inside:avoid}thead{display:table-header-group}tr{break-inside:avoid}}@page{size:A4;margin:15mm}</style></head><body><div class="toolbar"><button id="print-document">Print / Save as PDF</button></div><main><header><img src="' +
    escape(logoUrl) +
    '" alt="HAWK"><div><h1>' +
    title +
    "</h1><div>" +
    escape(settings.store.name) +
    '</div></div></header><p class="reference"><strong>' +
    (kind === "quote" ? "Q-" : "INV-") +
    escape(order.id) +
    "</strong><br>Order date: " +
    escape(new Date(order.createdAt).toLocaleDateString("en-ZA")) +
    "<br>Generated: " +
    escape(new Date().toLocaleDateString("en-ZA")) +
    '</p><h2>Bill to</h2><p class="pre">' +
    escape(data.name) +
    "<br>" +
    escape(data.email) +
    "<br>" +
    escape(data.address) +
    "</p><p><strong>Payment status:</strong> " +
    escape(data.payment || "unpaid") +
    (kind === "quote" ? " · Quotation only — not proof of payment." : "") +
    "</p><table><thead><tr><th>Product / pack</th><th>Quantity</th></tr></thead><tbody>" +
    lines +
    '</tbody></table><div class="totals">' +
    fact("Goods subtotal", money(amounts.goods)) +
    fact("Delivery / collection", money(amounts.shipping)) +
    '<div class="total">' +
    fact("Total (ZAR)", money(amounts.total)) +
    "</div>" +
    (typeof data.taxIncludedCents === "number" && !data.quoteAdjusted
      ? fact("Tax included in total", money(data.taxIncludedCents))
      : "") +
    "</div>" +
    (paymentHtml
      ? '<section class="payment"><h2>Payment details</h2>' +
        paymentHtml +
        '<p class="muted">Cash or bank-transfer payment is recorded only after the store confirms receipt.</p></section>'
      : "") +
    (payments.terms
      ? '<h2>Terms</h2><p class="pre">' + escape(payments.terms) + "</p>"
      : "") +
    '<footer class="footer"><strong>' +
    escape(settings.store.name) +
    '</strong><p class="pre">' +
    escape(settings.contact.address) +
    "<br>" +
    escape(settings.contact.email) +
    " · " +
    escape(settings.contact.phone) +
    "</p></footer></main></body></html>"
  );
}
