# HAWK transactional email design

All account verification, sign-in, password reset, welcome, quote, payment confirmation and fulfillment messages share the same HAWK email layout. The design uses the supplied white HAWK logo, a charcoal header (#171717), orange accents and buttons (#ff6600), a warm neutral background, readable typography and a consistent service footer.

Security emails use a large six-digit code panel and expiry guidance. Quote and confirmation messages include product quantities and a reference/total summary. Fulfillment emails include available courier, tracking and delivery details plus a signed order link. Plain-text content remains available through SMTP.

The renderer uses table layouts, inline styles and mobile adjustments. Dynamic content is HTML-escaped, actions require HTTPS, and the preheader never contains the verification code. It supports clients that block remote images with a descriptive logo alt label.

## Configuration

No additional settings are required for the current deployment. The default logo is /brand/hawk-white.png on the configured SITE_URL, falling back to the production deployment URL. Set SITE_URL when the production domain changes.

Optional server-only overrides:

- EMAIL_LOGO_URL: a complete HTTPS URL for the white HAWK logo.
- EMAIL_REPLY_TO: a support address for the SMTP Reply-To header and email footer. Otherwise the footer uses the SMTP user or sender address.

For a protected preview deployment, EMAIL_LOGO_URL can point to the publicly accessible production logo.

## Review samples

Run with Node.js 24:

```sh
node --env-file=.env qa/email-previews.mjs
```

Eight HTML samples are generated in node_modules/.tmp/hawk-email-previews. Samples contain fictitious order details and a nonfunctional verification code. The preview generator does not send messages.
