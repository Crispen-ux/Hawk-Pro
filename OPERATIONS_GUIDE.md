# HAWK store operations

## What is included

The original release scope is covered by catalogue editing and image uploads, stock control, orders and fulfillment, customer management, sales analysis, revenue reports, store settings and onboarding, campaign monitoring, customer/admin authentication and recovery, branded transactional emails, speaker details, delivery estimates and guest checkout.

## Customer delivery tracking

Customers can open the signed order link from their confirmation email, use a status-update email, or choose Track order & delivery in their verified account. No account is required for a guest tracking link. The tracking view exposes order items, totals and fulfillment details; it excludes customer addresses, names and emails.

In Orders, edit the fulfillment status and add the courier, tracking reference, HTTPS courier URL and estimated delivery date. The tracking view shows received, processing, shipped and delivered milestones. Estimates are explicitly estimates. Fulfillment transitions remain validated and shipping deducts the stock atomically. An order cannot consume stock reserved by another checkout.

Shipment changes create a versioned email notification. Delivery failure keeps the order saved and exposes Retry status email in Orders. Concurrent email claims and revision-specific idempotency keys prevent normal duplicate sends. A provider interruption can require a retry; email is not a reason to recreate an order. SITE_URL and the existing transactional email configuration must be present. Tracking reads saved fulfillment details without depending on the Payflex API being available.

## Inventory

Available stock equals on hand minus checkout reservations. Low-stock counts and filters use this available quantity. Enter a reason for receipts, returns and stocktakes. Recent on-hand adjustments and order dispatches are retained on each stock record (latest 100 movements), including time, balance, quantity change and reason. Reservation releases are also visible. Unit cost is optional; the stock valuation explicitly reports how many records have a cost. Inventory CSV includes reserved and available units. No automatic supplier purchasing is performed.

## Customers and engagement

The customer directory combines guest orders by email with saved customer records. It shows order history, lifetime paid value, first-purchase/returning/enquiry segments, internal notes and marketing permission. Search and segment filters apply to the customer CSV export. An administrator can save a preference or opt-out; that saved preference takes precedence over earlier checkout opt-ins. Guest checkout includes a separate, optional, unchecked marketing permission. Checking the order-details confirmation does not subscribe anyone.

Marketing emails are not bulk-sent by this portal. Export the subscribers segment for your approved email platform and honor subsequent opt-outs. Campaign activity is monitored using manually recorded platform figures.

## Reports

Reports accept a custom date range and presets. Day boundaries use Africa/Johannesburg. Gross recorded receipts use paidAt; legacy orders fall back to their creation date. Full refunds use refundedAt, with the same legacy fallback. Gross receipts retain the original payment even if a later refund was recorded. The report shows receipts less refunds, delivery charges, goods value, included tax when available, average receipt, sale units, quote requests, known unpaid value, preceding-period comparison and top products. CSV exports contain receipts and refund entries.

These are operational figures, not audited profit or tax filings. Partial refunds, payment fees, supplier costs and automatic Payflex refund synchronization are not implemented. Payflex payment changes must still be independently verified. Unpaid quotes do not count as receipts. Campaign attributed revenue is separate from recorded order receipts.

## Campaign monitoring

Record campaign dates, impressions, clicks, conversions, budget, spend and attributed revenue. The portal calculates ROAS, click-through rate, conversion rate, cost per click/conversion, budget use and remaining budget. Unknown ratios show a dash when their denominator is zero. Add a destination and UTM source/medium/campaign to generate a shareable campaign link. Export campaign metrics for reconciliation with the source platform. No ad-account connection, automatic attribution or campaign sending is implied.

## Launch checklist

Follow CHECKOUT_SETUP.md for migration 0003, Neon, Blob, Payflex, SITE_URL, email and actual product/delivery settings. This operations extension stores additional fields in existing JSON records and requires no further schema migration. Existing rows remain readable.

Before production, verify a configured preview through guest checkout, paid confirmation, processing, dispatch, tracking link, delivered update, email failure/retry, stock reservation/dispatch and a SADC quote. Check revenue totals against a known payment and refund. Automated tests cover the application logic and mocked provider/database boundaries; live PostgreSQL locking and real provider/email round trips still require your configured services. Deployment remains manual.
