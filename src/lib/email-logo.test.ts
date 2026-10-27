import { it, expect } from "vitest";
import nodemailer from "nodemailer";
import { emailTemplate } from "../../api/_lib/email-template";
import {
  HAWK_EMAIL_LOGO_CID,
  hawkEmailLogoAttachment,
} from "../../api/_lib/email-logo";
it("packages the actual HAWK PNG inside a multipart related email", async () => {
  const transport = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    newline: "unix",
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  try {
    const info = await transport.sendMail({
      from: "sender@hawk.example",
      to: "buyer@hawk.example",
      subject: "Logo rendering test",
      html: emailTemplate("Test", "Message", {}, true),
      attachments: [hawkEmailLogoAttachment()],
    });
    const mime = info.message.toString();
    expect(mime.includes("multipart/related")).toBe(true);
    expect(mime.includes("Content-ID: <" + HAWK_EMAIL_LOGO_CID + ">")).toBe(
      true,
    );
    expect(mime.includes("Content-Type: image/png")).toBe(true);
    expect(mime.includes("Content-Disposition: inline")).toBe(true);
    expect(mime.includes("iVBORw0KGgo")).toBe(true);
  } finally {
    transport.close();
  }
});
