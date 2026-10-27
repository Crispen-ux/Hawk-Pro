# Hawk administration

The existing Vite storefront now includes an admin workspace at `/admin` and customer accounts at `/account`. The admin interface uses the existing shadcn components, Lucide icons and Recharts. Currency is South African rand.

## What is implemented

- Existing catalogue editing, publication and image URL management, plus authenticated Vercel Blob uploads (JPEG/PNG/WebP, maximum 4 MB per file, eight images per product).
- Inventory counts and low-stock thresholds, with atomic stock deduction when dispatching an order.
- Manual order entry using server-calculated catalogue prices, payment recording, fulfillment status and tracking details. Payment recording does not charge a card.
- Customer directory with notes and explicit marketing consent.
- Sales totals, average order value, fulfillment metrics, top products, period filters and CSV exports.
- Campaign tracking with manually entered budget, spend, clicks, conversions and attributed revenue.
- Customer and admin password sign-in followed by email OTP, customer registration, verification and password reset. Admin accounts can only be provisioned by an operator.
- Hawk-branded HTML verification, welcome, order confirmation and status update emails. Order changes remain saved if delivery fails; the UI displays a warning.

## Vercel setup

1. Use Node.js 24 (pinned in `.nvmrc` and `package.json`). Import this folder into your Vercel project as a Vite application. Build: `pnpm build`; output: `dist`. `vercel.json` preserves `/api/*` and routes the frontend to `index.html`.
2. Connect a Neon Postgres database and public Vercel Blob store to the project. Set the server-only environment variables listed in `.env.example`. Generate `SESSION_SECRET` from at least 32 random bytes.
3. Pull development variables into `.env.local`. Database commands do not automatically load `.env.local`; export `DATABASE_URL` into the terminal, then run `pnpm db:push` against the intended database. Generated SQL migrations are also included in `db/migrations`.
4. Configure a verified transactional email sender. `EMAIL_API_URL` must be an HTTPS endpoint accepting a bearer token and JSON `{from,to:[address],subject,html}`. Set `EMAIL_API_TOKEN` and `EMAIL_FROM`. No provider is silently provisioned and no credentials are bundled.
5. Set `ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD` locally, then run `node db/create-admin.mjs`. The initial password must have at least 12 characters. This script promotes the specified account if it already exists and preserves its password. Remove the initial password afterward. Log in at `/admin/login`; the second factor is emailed to the administrator.
6. Deploy and verify registration → verification → welcome email, admin sign-in → OTP, reset → sign-in, image upload → product save, order creation → confirmation, fulfillment changes → update email, and reporting. Use a preview database and email inbox before production.

## Security and operating notes

Sessions are signed HttpOnly cookies with SameSite=Lax, Secure in production, and an eight-hour lifetime. Administrator access is checked against the database on every protected request. Password resets revoke existing sessions. Passwords use scrypt with random salts. OTPs are HMAC protected, expire in ten minutes, permit five attempts and are consumed once. Password attempts and account actions are rate limited in Postgres. The legacy shared passcode no longer authorizes admin data endpoints.

Order totals are snapshotted when created. Orders cannot have their product or quantity changed afterward. Fulfillment moves pending → processing → shipped → delivered; cancellation is available before shipment. Paid, non-cancelled orders contribute to revenue. Product prices use whole rands as in the existing catalogue.

Campaigns are monitoring records; this release does not send bulk campaigns or connect advertising analytics. Customer account authentication is separate from the pre-existing Hercules identity integration used by other optional site features.

No live database, email provider or Blob store was configured in this checkout. These integrations must be connected before the portal can operate. No production deployment has been made.

Storage references: https://vercel.com/docs/vercel-blob/using-blob-sdk and https://neon.com/docs/serverless/serverless-driver

## Validation

Production build and TypeScript checks passed. All 26 tests passed using Node.js 24 with a single Vitest worker thread. The local admin sign-in route returned HTTP 200. Browser visual verification was unavailable because the embedded browser could not connect to the preview. Live authentication, email delivery, Blob uploads and database workflows still require the configured services.

