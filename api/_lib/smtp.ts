import nodemailer from "nodemailer";
export function smtpTransport() {
  const host = process.env.SMTP_HOST?.trim(),
    user = process.env.SMTP_USER?.trim(),
    pass = process.env.SMTP_PASSWORD;
  const port = Number(process.env.SMTP_PORT || 587);
  if (!host || !user || !pass)
    throw new Error("SMTP delivery is not configured");
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("Invalid SMTP port");
  if (
    process.env.SMTP_SECURE &&
    !["true", "false"].includes(process.env.SMTP_SECURE)
  )
    throw new Error("SMTP_SECURE must be true or false");
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === "true"
    : port === 465;
  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: true,
      minVersion: "TLSv1.2",
      ...(process.env.SMTP_TLS_SERVERNAME
        ? { servername: process.env.SMTP_TLS_SERVERNAME }
        : {}),
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    dnsTimeout: 10000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
}
