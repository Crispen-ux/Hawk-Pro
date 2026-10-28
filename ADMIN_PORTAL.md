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

Authentication screens are directly accessible at `/admin/login`, `/admin/reset-password`, `/account/login`, `/account/signup`, and `/account/reset-password`. The admin navigation and nested pages are hidden until the server confirms a verified administrator session. Every admin route change is checked, and access is rechecked on window focus and every minute. Failed verification redirects to sign-in even if the API is unavailable. Public registration creates customer accounts only; provision staff accounts with `db/create-admin.mjs`.

Sessions are signed HttpOnly cookies with SameSite=Lax, Secure in production, and an eight-hour lifetime. Administrator access is checked against the database on every protected request. Password resets revoke existing sessions. Passwords use scrypt with random salts. OTPs are HMAC protected, expire in ten minutes, permit five attempts and are consumed once. Password attempts and account actions are rate limited in Postgres. The legacy shared passcode no longer authorizes admin data endpoints.

Order totals are snapshotted when created. Orders cannot have their product or quantity changed afterward. Fulfillment moves pending → processing → shipped → delivered; cancellation is available before shipment. Paid, non-cancelled orders contribute to revenue. Product prices use whole rands as in the existing catalogue.

Campaigns are monitoring records; this release does not send bulk campaigns or connect advertising analytics. Customer account authentication is separate from the pre-existing Hercules identity integration used by other optional site features.

No live database, email provider or Blob store was configured in this checkout. These integrations must be connected before the portal can operate. No production deployment has been made.

Storage references: https://vercel.com/docs/vercel-blob/using-blob-sdk and https://neon.com/docs/serverless/serverless-driver

## Validation

Production build and TypeScript checks passed. All 47 tests passed using Node.js 24 with a single Vitest worker thread. The local admin sign-in route returned HTTP 200. Browser checks confirmed the storefront and updated sign-in identity. Live authentication, email delivery, Blob uploads and database workflows still require the configured services.

## Store setup and shared identity

Administration now inherits the storefront Barlow/Barlow Condensed typography, orange brand accents, charcoal panels, shared theme tokens and bundled Hawk logos. Light and dark storefront themes also apply to administration.

New stores are directed to `/admin/onboarding` after administrator verification. The four steps cover store identity, contact and location, trading hours and announcement, then review and completion. Each completed step is saved in the existing settings record so setup can resume. Completion rejects the shipped placeholder contact details. Existing store records retain their current contact values and receive setup defaults automatically; no additional SQL migration is required.

`/admin/settings` edits those same settings and includes a live storefront preview. The public footer and contact blocks on About, Rentals and Repairs use this shared record. Email and phone details are clickable; multiline hours and addresses are preserved. Saved updates notify other open tabs and settings refresh when a tab receives focus. Failed loads are shown in administration so an unavailable database cannot silently lead to overwriting settings with defaults.

The integration tests cover saved setup progress, resume, save failures, storefront updates, focus refresh, and compatibility with existing settings. Browser QA confirmed the storefront and updated sign-in branding; full live onboarding requires the configured Neon database and an administrator session.

## Guest commerce update

Speaker details, delivery estimates and guest Payflex checkout are implemented. See CHECKOUT_SETUP.md for the new product migration, shipping-zone configuration, Payflex environment variables, SADC quote flow, reservations and verification steps.

## Store operations

See [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md) for customer tracking, customer profiles and consent, stock movement history, revenue reports and campaign monitoring.

## Server startup verification

Server-side relative imports include their `.ts` extensions so Node.js 24 can load the API modules directly. `npm run build` runs `npm run test:server-imports` before type checking and the frontend build. Use Node.js 24 as specified by `package.json`. This check loads both source and emitted JavaScript entry points, then verifies the compiled account handler returns 401 when signed out. It makes no network requests and performs no database writes.

A `FUNCTION_INVOCATION_FAILED` response means a function failed before it returned a normal application response. After updating the code, redeploy and verify `/api/account` returns 401 for a signed-out browser, then test password → emailed OTP → verified session. Database and email environment variables must be configured on that deployment. Failed OTP delivery returns a readable 503 response and removes the undelivered challenge so it does not leave a resend cooldown behind.

The root TypeScript configuration is also used by the Vercel function builder. It explicitly emits ES modules and enables `rewriteRelativeImportExtensions` so packaged `.js` files import other `.js` files. Project references alone do not pass the API compiler options to that builder.

## Batch product images

The product editor accepts multiple image files at once through the file picker or drag-and-drop area. The existing limit remains eight images per product and 4 MB per JPEG, PNG or WebP file. A sequential queue keeps gallery order stable, reports each result, retains successful uploads and allows failed uploads to be retried individually. The product cannot be saved while a batch is running. Save changes after upload to persist the gallery. Each file uses the existing authenticated /api/upload endpoint and its server-side validation.

## Website content and promotions

Open Store settings → Manage website content, or /admin/settings/content. Eleven fixed image positions cover Home (eight), Rentals hero, Repairs hero and About main image. Replace an image, drag to reposition, adjust zoom (10–300%; below 100% reveals more of the original image and may expose the frame background), and save independent desktop/mobile crops. Cropping retains the full processed image. Images are resized to a maximum 2400 px and compressed to WebP before the existing authenticated upload (4 MB maximum); choose an original up to 25 MB. The draft media library retains up to 100 reusable uploaded images.

The homepage hero heading, description and primary button are editable. Hero overlay controls adjust readability. CNC footage uses a direct HTTPS MP4/WebM URL, optional uploaded poster, heading, description and visibility switch; the same player appears on Home and About, with controls and no autoplay. Large video files must be hosted separately; this release does not upload video files.

Promotions support up to twelve announcement strips, homepage banners or shop banners with optional images and links. Start/end inputs use South African time (UTC+02:00), independent of the operator's computer timezone. Enabled banners appear at their start and disappear at their end. Banners advertise offers only; they do not change prices or apply checkout discounts.

Save draft keeps edits private. Preview page opens the actual page layout in a desktop/mobile iframe after administrator verification. Publish content updates public content; restore previous publication swaps back to the prior publication. Drafts and prior versions require administrator access. Optimistic revision checks reject conflicting saves with HTTP 409. Reload saved draft discards unsaved local edits. Content uses a separate website-content record in the existing settings table, with no SQL migration. All existing administrators have access; there is no separate content-editor role.

Local source changes only: no GitHub push, deployment, or production content/database writes were performed for this feature.

Promotional banner previews now share the storefront renderer and include desktop/mobile widths. Full banner images fit without cropping; announcement strips remain text-only. Each promotion can customize text size, alignment, background/text colours, and solid or outlined button colours. Existing saved promotions remain compatible.
