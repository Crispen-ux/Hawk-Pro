import { HAWK_EMAIL_LOGO_CID } from "./email-logo.ts";
export type EmailDesign = {
  eyebrow?: string;
  preheader?: string;
  intro?: string;
  code?: string;
  action?: { label: string; url: string };
  facts?: { label: string; value: string }[];
  items?: {
    name: string;
    quantity: number;
    detail?: string;
    amount?: string;
  }[];
};
export const escapeEmailHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
function https(value: string | undefined) {
  try {
    const u = new URL(value ?? "");
    return u.protocol === "https:" && !u.username && !u.password ? u.href : "";
  } catch {
    return "";
  }
}
export function emailSiteUrl() {
  const configured =
    https(process.env.SITE_URL) ||
    https(
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? "https://" + process.env.VERCEL_PROJECT_PRODUCTION_URL
        : "",
    );
  return configured
    ? new URL(configured).origin
    : "https://hawkprofessional.vercel.app";
}
export function emailTemplate(
  title: string,
  message: string,
  design: EmailDesign = {},
  embeddedLogo = false,
) {
  const e = escapeEmailHtml,
    site = emailSiteUrl(),
    logo = embeddedLogo
      ? "cid:" + HAWK_EMAIL_LOGO_CID
      : https(process.env.EMAIL_LOGO_URL) || site + "/brand/hawk-white.png";
  const support = (
    process.env.EMAIL_REPLY_TO ||
    process.env.SMTP_USER ||
    process.env.EMAIL_FROM?.match(/<([^>]+)>/)?.[1] ||
    process.env.EMAIL_FROM ||
    ""
  ).trim();
  const supportLink = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(support)
    ? `<a href="mailto:${e(support)}" style="color:#525252;text-decoration:underline;">${e(support)}</a>`
    : "";
  const paragraphs = (design.intro ?? message)
    .split(/\n+/)
    .filter(Boolean)
    .map(
      (text) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.75;color:#525252;">${e(text)}</p>`,
    )
    .join("");
  const facts = design.facts?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e2dd;margin:24px 0;">${design.facts.map((row) => `<tr><td style="padding:12px 0;border-bottom:1px solid #e5e2dd;color:#737373;font-size:13px;vertical-align:top;">${e(row.label)}</td><td align="right" style="padding:12px 0 12px 16px;border-bottom:1px solid #e5e2dd;color:#171717;font-size:13px;font-weight:600;vertical-align:top;overflow-wrap:anywhere;">${e(row.value)}</td></tr>`).join("")}</table>`
    : "";
  const items = design.items?.length
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border-collapse:collapse;"><thead><tr><th align="left" style="padding:10px 0;border-bottom:2px solid #171717;font-size:11px;letter-spacing:1px;color:#737373;text-transform:uppercase;">Your equipment</th><th align="right" style="padding:10px 0;border-bottom:2px solid #171717;font-size:11px;color:#737373;">QTY</th></tr></thead><tbody>${design.items.map((item) => `<tr><td style="padding:16px 12px 16px 0;border-bottom:1px solid #e5e2dd;font-size:14px;line-height:1.6;color:#171717;"><strong>${e(item.name)}</strong>${item.detail ? `<br><span style="font-size:12px;color:#737373;">${e(item.detail)}</span>` : ""}${item.amount ? `<br><span style="font-size:13px;">${e(item.amount)}</span>` : ""}</td><td align="right" style="padding:16px 0;border-bottom:1px solid #e5e2dd;font-size:14px;color:#171717;vertical-align:top;">${e(String(item.quantity))}</td></tr>`).join("")}</tbody></table>`
    : "";
  const code =
    design.code && /^\d{6}$/.test(design.code)
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td align="center" style="background:#f5f3ef;border:1px solid #e5e2dd;border-top:3px solid #ff6600;padding:24px 16px;"><p style="margin:0 0 12px;font-size:10px;font-weight:700;letter-spacing:2px;color:#737373;text-transform:uppercase;">Your verification code</p><p class="email-code" style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:40px;font-weight:700;line-height:1.3;letter-spacing:8px;color:#171717;">${e(design.code)}</p><p style="margin:14px 0 0;font-size:12px;color:#737373;">Expires in 10 minutes · Never share this code</p></td></tr></table>`
      : "";
  const actionUrl = https(design.action?.url);
  const action =
    actionUrl && design.action
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 12px;"><tr><td align="center" bgcolor="#ff6600" style="border-radius:3px;mso-padding-alt:15px 26px;"><a href="${e(actionUrl)}" style="display:inline-block;padding:15px 26px;background:#ff6600;border:1px solid #ff6600;border-radius:3px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;line-height:1.4;color:#171717;text-decoration:none;">${e(design.action.label)}</a></td></tr></table>`
      : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${e(title)}</title><style>@media only screen and (max-width:620px){.email-outer{padding:16px 8px!important}.email-content{padding:28px 22px!important}.email-heading{font-size:26px!important}.email-code{font-size:34px!important;letter-spacing:6px!important}.email-header{padding:22px!important}}</style></head><body style="margin:0;padding:0;background:#f5f3ef;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;"><div style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;mso-hide:all;">${e(design.preheader ?? title)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f5f3ef"><tr><td class="email-outer" align="center" style="padding:40px 16px;"><!--[if mso]><table role="presentation" width="600"><tr><td><![endif]--><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e5e2dd;border-collapse:separate;border-spacing:0;"><tr><td class="email-header" bgcolor="#171717" style="padding:26px 34px;border-bottom:4px solid #ff6600;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td><a href="${e(site)}" style="color:#ffffff;text-decoration:none;"><img src="${e(logo)}" width="112" height="70" alt="HAWK Pro Audio" style="display:block;width:112px;height:70px;object-fit:contain;border:0;color:#ffffff;font-family:Arial,sans-serif;font-size:17px;"></a></td><td align="right" style="color:#f5f3ef;font-size:10px;font-weight:700;letter-spacing:2px;line-height:1.8;">PRO AUDIO<br><span style="color:#ff6600;letter-spacing:1px;">BUILT FOR PERFORMANCE</span></td></tr></table></td></tr><tr><td class="email-content" style="padding:36px 34px 32px;"><p style="margin:0 0 12px;color:#ff6600;font-size:10px;font-weight:700;line-height:1.5;letter-spacing:2px;text-transform:uppercase;">${e(design.eyebrow ?? "HAWK PRO AUDIO")}</p><h1 class="email-heading" style="margin:0 0 22px;color:#171717;font-family:Arial,Helvetica,sans-serif;font-size:29px;font-weight:700;line-height:1.25;letter-spacing:-0.6px;">${e(title)}</h1>${paragraphs}${code}${items}${facts}${action}<p style="margin:28px 0 0;color:#737373;font-size:12px;line-height:1.7;">The HAWK team</p></td></tr><tr><td style="padding:24px 34px;background:#faf9f7;border-top:1px solid #e5e2dd;"><p style="margin:0 0 8px;color:#171717;font-size:11px;font-weight:700;letter-spacing:0.5px;">ENGINEERED FOR SOUND. BUILT FOR PERFORMANCE.</p><p style="margin:0;color:#737373;font-size:12px;line-height:1.8;">HAWK Pro Audio<br><a href="${e(site)}" style="color:#525252;text-decoration:underline;">Visit the store</a>${supportLink ? " &nbsp;·&nbsp; " + supportLink : ""}</p><p style="margin:14px 0 0;font-size:10px;line-height:1.7;color:#8a8a8a;">This is a service email about your HAWK account, order or enquiry.</p></td></tr></table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>`;
}
