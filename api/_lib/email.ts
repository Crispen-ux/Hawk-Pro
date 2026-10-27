const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function emailTemplate(title: string, message: string) {
  return `<div style="background:#f4f6fa;padding:40px;font-family:Arial,sans-serif;color:#192338"><div style="max-width:560px;margin:auto;background:white;border-radius:16px;overflow:hidden"><div style="background:#192338;color:white;padding:28px;font-size:26px;font-weight:bold">HAWK <span style="color:#ff8a4c;font-size:12px">PRO AUDIO</span></div><div style="padding:32px"><h1 style="font-size:23px">${escapeHtml(title)}</h1><p style="line-height:1.8;white-space:pre-line">${escapeHtml(message)}</p><hr style="border:0;border-top:1px solid #eee;margin-top:32px"><p style="font-size:12px;color:#687385">Engineered for sound. Built for performance.<br>Hawk Pro Audio</p></div></div></div>`;
}
export async function sendEmail(to: string, title: string, message: string) {
  const endpoint = process.env.EMAIL_API_URL;
  const token = process.env.EMAIL_API_TOKEN;
  const from = process.env.EMAIL_FROM;
  if (!endpoint || !token || !from)
    throw new Error("Email delivery is not configured");
  const url = new URL(endpoint);
  if (url.protocol !== "https:")
    throw new Error("Email endpoint must use HTTPS");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: title,
      html: emailTemplate(title, message),
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("Email delivery failed");
}
