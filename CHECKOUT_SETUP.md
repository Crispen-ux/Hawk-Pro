# Speaker pages, delivery and guest checkout

## Scope

The product catalogue now has structured speaker and shipping information. Product pages show single/pair/set quantities, active/passive type, published specifications, box contents, dispatch lead time, warranty details, image enlargement and delivery estimates. Missing information is never fabricated.

The cart leads to a two-step guest checkout: details/delivery, then review. No account or password is required. South African orders can continue to Payflex hosted checkout when the store is configured and sufficient stock is available. Other SADC destinations, specialist freight, unpriced products and uncovered delivery zones use a guest quote request. Quote requests do not charge or reserve stock.

## Database update

Apply the generated migration db/migrations/0003_sour_wallop.sql using your normal migration process, or run pnpm db:push against the intended database. This adds the products.details JSON column. Existing products keep their descriptions, prices, images, specifications and availability. New metadata defaults to unknown values. Inventory reservations use the existing commerce JSON records and require no new stock table.

Complete store onboarding before enabling online payment.

## Product preparation

In Admin → Products, enter the actual SKU, pack quantity, powered/passive type, technical data, box contents, warranty and dispatch times. Enter packed weight; add packed dimensions if your delivery rules use a volumetric divisor. Mark specialist freight items accordingly. Set availability to In stock and record inventory before offering online purchases. Inventory is counted in sale units/packs: if a SKU is a pair, one stock unit represents that pair.

Coming-soon, unavailable and incompletely described products can still request a quote. They cannot be silently treated as confirmed, paid stock.

## Delivery settings

Admin → Store settings → Delivery & guest checkout contains the dispatch country, collection option, delivery conditions, returns process, included-tax percentage and delivery zones. Dispatch defaults to South Africa and can be changed explicitly.

Each enabled delivery zone needs its country coverage, base price, additional price per rounded-up billable kilogram and minimum/maximum transit time. A maximum shipment weight is optional. Postcode prefixes create more specific zones; the longest matching prefix wins. Identical active coverage is rejected. Leave fees unset until you have confirmed your actual courier rates.

If a volumetric divisor is supplied, billable weight is the greater of packed weight and packed volume divided by that divisor. The divisor must come from your courier agreement. Orders with missing packed details or weight beyond the configured parcel limit request a quote.

All customer prices and Payflex amounts are in ZAR. Enter the tax percentage already included in your published goods and delivery prices only when applicable; the app reports that included amount rather than adding tax again. Estimates use weekdays and are not guarantees of arrival. Public holidays and border clearance can affect transit.

These are merchant-configured delivery estimates, not live courier API quotes or shipping-label purchases.

## Payflex environment variables

Set PAYFLEX_CLIENT_ID, PAYFLEX_CLIENT_SECRET, SESSION_SECRET and SITE_URL on the server. SITE_URL must be your exact HTTPS storefront origin, such as your Vercel preview or production domain, without an extra path. Never use VITE_ prefixes for credentials.

Use PAYFLEX_ENVIRONMENT=sandbox with a preview database for testing. Use PAYFLEX_ENVIRONMENT=live with your live merchant credentials in production. Vercel production deployments refuse sandbox payment configuration. Payflex's merchant agreement and API credentials must be active before payment can be enabled.

The implementation uses Payflex OAuth client credentials, POST /order, and its returned hosted-checkout URL. Return and callback URLs are registered with each order. The browser return URL never marks an order paid. The server independently queries GET /order/{orderId} and verifies the merchant reference, amount and provider order ID before accepting Approved.

Payflex documents South Africa-only operation. Other SADC destinations therefore submit a guest quote request, as agreed for this release. Their delivery and payment arrangements are confirmed by your team.

## Reservations, retries and operations

Prices, delivery and totals are calculated on the server. A PostgreSQL statement locks the selected product and inventory rows, verifies all requested quantities, creates one order and reserves all its items atomically. The same checkout attempt key cannot create a second local order or Payflex session. Product revisions and displayed delivery totals are rechecked before reservation.

Guest order links use an opaque, signed access value and expose receipt information rather than customer addresses. Checkout attempts persist only the order identifier and access value in session storage; customer addresses and passwords are not stored there. Retrying after a network error checks the existing attempt. Changed details cannot silently create another payment while that attempt is unresolved.

A known Payflex setup rejection releases its reservation. An uncertain order-creation outcome retains the order and reservation for investigation. Verified Declined or Abandoned statuses release reserved units. Approved orders retain their allocation until dispatch, when on-hand stock and the reservation are reduced together. Other orders cannot consume stock held by checkout. Stock on hand cannot be edited below reserved quantity.

Admin → Orders provides Refresh Payflex status. If payment creation was uncertain and no provider ID was returned, use the Payflex order ID from your merchant portal to reconcile it; the server still verifies the reference and amount. Do not create another payment to resolve an uncertain first payment.

Quote requests and verified paid orders receive branded confirmations. Email delivery failures keep the order saved and can be retried. Fulfillment updates continue to use the existing order emails. Configure the existing transactional email variables before launch.

Cross-border quotes can record an agreed goods subtotal and delivery charge before your team records an externally arranged payment. Payflex payments cannot be manually marked paid in administration. This release does not initiate or automatically synchronize Payflex refunds; those remain merchant-managed.

## Verification and launch

Automated tests cover delivery calculations, unconfigured zones, SADC quote-only behavior, stock availability, price tampering, checkout retries, concurrent duplicate requests, guest forms, callback forgery and provider verification. The actual PostgreSQL locking and live Payflex/email round-trip require your configured preview services for end-to-end validation.

After configuration, test a real preview product through cart → delivery estimate → guest review → Payflex sandbox → verified return → confirmation email → admin processing → dispatch. Also test cancellation/abandonment, repeated callback delivery, a SADC quote request and a parcel requiring freight. Confirm that production uses live credentials only after those checks.

Official references: https://docs.payflex.co.za/docs/getting-started, https://docs.payflex.co.za/docs/authentication, https://docs.payflex.co.za/docs/order, https://docs.payflex.co.za/docs/checkout-integration, and https://www.sadc.int/member-states.
