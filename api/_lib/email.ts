import { createHash } from "node:crypto";
import { smtpTransport } from "./smtp.ts";
import { emailTemplate, type EmailDesign } from "./email-template.ts";
export { emailTemplate, emailSiteUrl } from "./email-template.ts";
export async function sendEmail(
  to: string,
  title: string,
  message: string,
  idempotencyKey?: string,
  design: EmailDesign = {},
) {
  const endpoint = process.env.EMAIL_API_URL;
  const token = process.env.EMAIL_API_TOKEN;
  const from = process.env.EMAIL_FROM;
  const transport = process.env.EMAIL_TRANSPORT || (endpoint ? "api" : "smtp");
  if (!from) throw new Error("Email sender is not configured");
  if (transport === "smtp") {
    const client = smtpTransport();
    try {
      const result = await client.sendMail({
        from,
        to,
        subject: title,
        text:
          message +
          (design.code ? "\nVerification code: " + design.code : "") +
          (design.action
            ? "\n" + design.action.label + ": " + design.action.url
            : ""),
        html: emailTemplate(title, message, design),
        ...(process.env.EMAIL_REPLY_TO
          ? { replyTo: process.env.EMAIL_REPLY_TO }
          : {}),
        ...(idempotencyKey
          ? {
              messageId:
                "<" +
                createHash("sha256").update(idempotencyKey).digest("hex") +
                "@" +
                process.env.SMTP_HOST +
                ">",
            }
          : {}),
      });
      if (!result.accepted?.length || result.rejected?.length)
        throw new Error("SMTP recipient was not accepted");
    } catch (error) {
      const e = error as { code?: string; responseCode?: number };
      console.error("SMTP delivery failed", {
        code: e.code ?? "SMTP_ERROR",
        responseCode: e.responseCode,
      });
      throw new Error("Email delivery failed");
    } finally {
      client.close();
    }
    return;
  }
  if (transport !== "api") throw new Error("Unsupported email transport");
  if (!endpoint || !token) throw new Error("Email delivery is not configured");
  const url = new URL(endpoint);
  if (url.protocol !== "https:")
    throw new Error("Email endpoint must use HTTPS");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: title,
      html: emailTemplate(title, message, design),
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("Email delivery failed");
}
