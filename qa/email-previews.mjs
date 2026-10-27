// Design samples only. No real customer data, verification codes or email delivery.
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { emailTemplate, emailSiteUrl } from "../api/_lib/email-template.ts";
const output = new URL(
  "../node_modules/.tmp/hawk-email-previews/",
  import.meta.url,
);
await mkdir(output, { recursive: true });
const site = emailSiteUrl(),
  items = [
    {
      name: "HAWK BOX",
      quantity: 2,
      detail: "Sold individually — 1 unit",
      amount: "R 4,800.00",
    },
  ],
  facts = [
    { label: "Order reference", value: "HAWK-PREVIEW" },
    { label: "Total paid", value: "R 4,950.00" },
  ];
const samples = [
  [
    "verification",
    "Your HAWK sign-in code",
    "Use this code to finish signing in to your account.\nIf you did not request this, you can safely ignore this email.",
    {
      eyebrow: "Account security",
      preheader: "Your secure HAWK code expires in 10 minutes.",
      code: "123456",
    },
  ],
  [
    "password-reset",
    "Reset your HAWK password",
    "Use this code to reset your password.\nIf you did not request a password reset, you can safely ignore this email.",
    { eyebrow: "Account security", code: "123456" },
  ],
  [
    "welcome",
    "Welcome to HAWK",
    "Hi Alex,\nYour email is verified and your account is ready. Explore our speakers, subwoofers and professional audio equipment.",
    {
      eyebrow: "Welcome to the HAWK community",
      action: { label: "Explore the collection", url: site + "/shop" },
    },
  ],
  [
    "quote",
    "We received your quote request",
    "Hi Alex,\nThank you for your interest in HAWK. Our team will confirm availability, delivery costs and payment arrangements. No payment has been taken.",
    {
      eyebrow: "Quote request",
      items,
      facts: [
        { label: "Reference", value: "HAWK-PREVIEW" },
        { label: "Payment", value: "No payment taken" },
      ],
      action: { label: "View your request", url: site + "/shop" },
    },
  ],
  [
    "order-confirmation",
    "Your HAWK order is confirmed",
    "Hi Alex,\nYour payment is confirmed and your order is with our team. We will keep you updated as it moves towards delivery.",
    {
      eyebrow: "Order confirmation",
      items,
      facts,
      action: { label: "View your order", url: site + "/shop" },
    },
  ],
  [
    "shipment",
    "Your order is on its way",
    "Hi Alex,\nYour equipment has been dispatched. View the latest progress and delivery details using the link below.",
    {
      eyebrow: "Order update",
      facts: [
        ...facts,
        { label: "Courier", value: "Example courier" },
        { label: "Tracking reference", value: "PREVIEW-ONLY" },
      ],
      action: { label: "Track your order", url: site + "/shop" },
    },
  ],
  [
    "delivery",
    "Your order has been delivered",
    "Hi Alex,\nYour order is marked as delivered. Thank you for choosing HAWK. Contact our team if you need help with your equipment.",
    {
      eyebrow: "Order update",
      facts,
      action: { label: "View your order", url: site + "/shop" },
    },
  ],
  [
    "cancellation",
    "Your order has been cancelled",
    "Hi Alex,\nYour order is marked as cancelled. Contact our team if you need assistance with the next steps.",
    {
      eyebrow: "Order update",
      facts: [
        { label: "Reference", value: "HAWK-PREVIEW" },
        { label: "Status", value: "Cancelled" },
      ],
      action: { label: "View your order", url: site + "/shop" },
    },
  ],
];
for (const [name, title, message, design] of samples)
  await writeFile(
    new URL(name + ".html", output),
    emailTemplate(title, message, design),
  );
console.log("Email previews saved to " + fileURLToPath(output));
