import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
const smtp = vi.hoisted(() => ({ sendMail: vi.fn(), close: vi.fn() }));
vi.mock("nodemailer", () => ({
  default: { createTransport: vi.fn(() => smtp) },
}));
import nodemailer from "nodemailer";
import { sendEmail } from "../../api/_lib/email";
import { smtpTransport } from "../../api/_lib/smtp";
beforeEach(() => {
  vi.stubEnv("EMAIL_TRANSPORT", "smtp");
  vi.stubEnv("EMAIL_FROM", "HAWK Test <sender@hawk.example>");
  vi.stubEnv("SMTP_HOST", "mail.hawk.example");
  vi.stubEnv("SMTP_USER", "sender@hawk.example");
  vi.stubEnv("SMTP_PASSWORD", "test-only-password");
  vi.stubEnv("SMTP_PORT", "587");
  vi.stubEnv("SMTP_SECURE", "false");
  smtp.sendMail.mockResolvedValue({
    accepted: ["buyer@hawk.example"],
    rejected: [],
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
describe("transactional email transports", () => {
  it("uses authenticated STARTTLS on port 587 and sends branded HTML plus text", async () => {
    await sendEmail("buyer@hawk.example", "Verification", "Test message");
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 587,
        secure: false,
        requireTLS: true,
        tls: expect.objectContaining({
          rejectUnauthorized: true,
          minVersion: "TLSv1.2",
        }),
        auth: { user: "sender@hawk.example", pass: "test-only-password" },
        disableFileAccess: true,
        disableUrlAccess: true,
      }),
    );
    expect(smtp.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "HAWK Test <sender@hawk.example>",
        to: "buyer@hawk.example",
        text: "Test message",
        html: expect.stringContaining("HAWK"),
      }),
    );
    expect(smtp.close).toHaveBeenCalled();
  });
  it("fails rejected recipients and closes the SMTP connection without logging the password", async () => {
    smtp.sendMail.mockRejectedValue(
      Object.assign(new Error("private provider error"), {
        code: "EAUTH",
        responseCode: 535,
      }),
    );
    await expect(
      sendEmail("buyer@hawk.example", "Verification", "Message"),
    ).rejects.toThrow("Email delivery failed");
    expect(smtp.close).toHaveBeenCalled();
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      "test-only-password",
    );
  });
  it("does not consider an unaccepted recipient a successful delivery", async () => {
    smtp.sendMail.mockResolvedValue({
      accepted: [],
      rejected: ["buyer@hawk.example"],
    });
    await expect(
      sendEmail("buyer@hawk.example", "Title", "Message"),
    ).rejects.toThrow("Email delivery failed");
  });
  it("validates SMTP configuration before opening a connection", () => {
    vi.stubEnv("SMTP_PORT", "not-a-port");
    expect(() => smtpTransport()).toThrow("Invalid SMTP port");
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });
  it("uses the existing HTTPS API transport when selected", async () => {
    vi.stubEnv("EMAIL_TRANSPORT", "api");
    vi.stubEnv("EMAIL_API_URL", "https://email.hawk.example/send");
    vi.stubEnv("EMAIL_API_TOKEN", "test-token");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 200 })),
    );
    await sendEmail("buyer@hawk.example", "Title", "Message", "test-key");
    expect(fetch).toHaveBeenCalledWith(
      new URL("https://email.hawk.example/send"),
      expect.objectContaining({
        headers: expect.objectContaining({ "Idempotency-Key": "test-key" }),
      }),
    );
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
