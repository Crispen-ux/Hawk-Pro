import { expect, it } from "vitest";
import {
  documentPaymentsSchema,
  DEFAULT_DOCUMENT_PAYMENTS,
} from "../../db/document-payments-validation";
import { documentAmounts, renderOrderDocument } from "./order-document";
import { store, ORDER_ID, PRODUCT_ID } from "../test-fixtures/commerce";
import type { CommerceRecord } from "../../db/commerce-validation";
const order = (): CommerceRecord => ({
  id: ORDER_ID,
  kind: "orders",
  createdAt: "2026-10-27T12:00:00Z",
  data: {
    name: "Test buyer",
    email: "buyer@example.com",
    productId: PRODUCT_ID,
    productName: "Speaker",
    quantity: 2,
    address: "Test address",
    total: 4800,
    payment: "unpaid",
  },
});
const payments = () =>
  documentPaymentsSchema.parse({
    bankEnabled: true,
    bankName: "Example bank",
    accountHolder: "Example account",
    accountNumber: "000123",
    accountType: "Business",
    branchCode: "001234",
    cashEnabled: true,
    cashInstructions: "Pay cash at collection by arrangement.",
  });
it("requires complete banking and cash instructions before enabling them", () => {
  expect(documentPaymentsSchema.safeParse({ bankEnabled: true }).success).toBe(
    false,
  );
  expect(documentPaymentsSchema.safeParse({ cashEnabled: true }).success).toBe(
    false,
  );
  expect(documentPaymentsSchema.parse({}).bankEnabled).toBe(false);
});
it("shows enabled bank and cash options with the order reference without changing payment status", () => {
  const value = order();
  const html = renderOrderDocument(
    value,
    store(),
    payments(),
    "invoice",
    "bank-transfer-or-cash",
    "https://example.com/logo.png",
  );
  expect(html).toContain("000123");
  expect(html).toContain("001234");
  expect(html).toContain(value.id);
  expect(html).toContain("Pay cash at collection");
  expect(html).toContain("unpaid");
  expect(value.data.payment).toBe("unpaid");
});
it("uses agreed quote amounts, keeps unknown delivery unknown, and blocks premature invoices", () => {
  const value = order();
  value.data = {
    ...value.data,
    source: "storefront",
    subtotalCents: 480000,
    shippingCents: null,
    goodsQuoteZar: 4500,
  };
  expect(documentAmounts(value.data)).toEqual({
    goods: 450000,
    shipping: null,
    total: null,
  });
  expect(() =>
    renderOrderDocument(value, store(), payments(), "invoice", "cash", "logo"),
  ).toThrow("Confirm goods pricing");
  expect(
    renderOrderDocument(value, store(), payments(), "quote", "cash", "logo"),
  ).toContain("To be confirmed");
  value.data.deliveryQuoteZar = 250;
  expect(documentAmounts(value.data).total).toBe(475000);
});
it("does not publish disabled bank details or offer cash on Payflex orders", () => {
  expect(() =>
    renderOrderDocument(
      order(),
      store(),
      DEFAULT_DOCUMENT_PAYMENTS,
      "quote",
      "bank-transfer",
      "logo",
    ),
  ).toThrow("Enable and save banking");
  const value = order();
  value.data.paymentProvider = "payflex";
  const html = renderOrderDocument(
    value,
    store(),
    payments(),
    "invoice",
    "bank-transfer-or-cash",
    "logo",
  );
  expect(html).toContain("Payment via Payflex");
  expect(html).not.toContain("000123");
  expect(html).not.toContain("Cash payment");
});
it("escapes customer and banking content in printable documents", () => {
  const value = order();
  value.data.name = '<script>alert("x")</script>';
  const config = payments();
  config.bankName = "<img src=x onerror=alert(1)>";
  const html = renderOrderDocument(
    value,
    store(),
    config,
    "quote",
    "bank-transfer",
    "logo",
  );
  expect(html).not.toContain("<script>");
  expect(html).not.toContain("<img src=x");
  expect(html).toContain("&lt;script&gt;");
  expect(html).toContain("&lt;img");
});
