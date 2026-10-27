import { afterEach, describe, it, expect, vi } from "vitest";
import { emailTemplate } from "../../api/_lib/email-template";
afterEach(() => vi.unstubAllEnvs());
describe("HAWK email branding", () => {
  it("uses the real HAWK logo, brand colours and an absolute HTTPS asset URL", () => {
    vi.stubEnv("SITE_URL", "https://hawk.example");
    const html = emailTemplate("Welcome", "Hello");
    expect(html).toContain("https://hawk.example/brand/hawk-white.png");
    expect(html).toContain('alt="HAWK Pro Audio"');
    expect(html).toContain("#171717");
    expect(html).toContain("#ff6600");
    expect(html).toContain('role="presentation"');
  });
  it("renders a prominent verification code without exposing it in the preheader", () => {
    const html = emailTemplate(
      "Your sign-in code",
      "Use the code to sign in.",
      {
        code: "123456",
        eyebrow: "Account security",
        preheader: "Your secure code expires in 10 minutes.",
      },
    );
    expect(html).toContain("letter-spacing:8px");
    expect(html).toContain("123456");
    expect(html).toContain("Expires in 10 minutes");
    expect(html.slice(0, html.indexOf("<table"))).not.toContain("123456");
  });
  it("escapes unsafe titles, body text, summaries and product names", () => {
    const html = emailTemplate(
      "<script>alert(1)</script>",
      "<img src=x onerror=alert(1)>",
      {
        facts: [{ label: "<b>Reference</b>", value: "<script>x</script>" }],
        items: [{ name: "<img src=x>", quantity: 1 }],
      },
    );
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img");
    expect(html).toContain("&lt;b&gt;Reference");
  });
  it("rejects unsafe action and logo URLs", () => {
    vi.stubEnv("EMAIL_LOGO_URL", "javascript:alert(1)");
    const html = emailTemplate("Order", "Ready", {
      action: { label: "Open", url: "javascript:alert(1)" },
    });
    expect(html).not.toContain("javascript:");
    expect(html).toContain("/brand/hawk-white.png");
  });
  it("includes order items, a summary and a safe call to action", () => {
    const html = emailTemplate("Order confirmed", "Thank you", {
      items: [
        {
          name: "HAWK BOX",
          quantity: 2,
          detail: "Sold individually",
          amount: "R 4,800.00",
        },
      ],
      facts: [{ label: "Reference", value: "HAWK-EXAMPLE" }],
      action: {
        label: "View your order",
        url: "https://hawk.example/orders/example?access=test&mode=track",
      },
    });
    expect(html).toContain("HAWK BOX");
    expect(html).toContain("HAWK-EXAMPLE");
    expect(html).toContain("access=test&amp;mode=track");
    expect(html).toContain("View your order");
  });
});
