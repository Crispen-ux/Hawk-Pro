# SMTP testing and production setup

The existing transactional email helper supports both SMTP and an HTTPS sending API. OTP, password reset, welcome, quote, payment confirmation and fulfillment emails all use the same transport.

## Test mailbox

Set these server-only variables in Vercel for the environment you are testing, then deploy the latest commit:

```env
EMAIL_TRANSPORT=smtp
EMAIL_FROM=HAWK Test <dev@cretekgroup.co.za>
SMTP_HOST=mail.cretekgroup.co.za
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=dev@cretekgroup.co.za
SMTP_PASSWORD=<mailbox password>
```

Port 587 uses required STARTTLS with certificate validation; false means TLS is negotiated after connecting, not that authentication is sent in clear text. The configured sender must be allowed by the mailbox provider. The supplied test password is stored in the ignored local .env only; it is not in this guide or the example file.

SMTP_TLS_SERVERNAME is optional and is only needed when the mail host explicitly supplies a different valid TLS certificate hostname. Certificate verification is never disabled.

EMAIL_API_URL and EMAIL_API_TOKEN are unnecessary when EMAIL_TRANSPORT=smtp. To use the previous API integration, choose EMAIL_TRANSPORT=api and configure those variables plus EMAIL_FROM. When EMAIL_TRANSPORT is omitted, a configured API URL selects the API; otherwise SMTP is used. Failed sends do not switch transports automatically.

Database notification claims prevent normal duplicate status emails. SMTP itself provides no exactly-once delivery guarantee; stable Message-ID headers help trace retries. No connection pooling is used in short-lived functions, and each SMTP connection is closed after sending.

## Switching to the production domain

Once the production sender is ready, replace EMAIL_FROM, SMTP_HOST, SMTP_USER and SMTP_PASSWORD with the production mailbox details, confirm its permitted sending domain, and redeploy. No application code changes are needed.

## Verification

An SMTP connection test checks TLS and mailbox authentication. A test message accepted by the SMTP server confirms submission, not inbox placement. Verify the test mailbox inbox and spam folder, then sign in to administration and confirm the emailed OTP. Password acceptance alone does not issue an administrator session.
