import { z } from "zod";

const text = (max = 160) => z.string().trim().max(max).default("");
export const documentPaymentsSchema = z
  .object({
    bankEnabled: z.boolean().default(false),
    bankName: text(),
    accountHolder: text(),
    accountNumber: text(60),
    accountType: text(80),
    branchCode: text(40),
    swiftCode: text(40),
    bankInstructions: text(1000),
    cashEnabled: z.boolean().default(false),
    cashInstructions: text(1000),
    terms: text(1500),
  })
  .superRefine((value, ctx) => {
    if (value.bankEnabled)
      for (const key of [
        "bankName",
        "accountHolder",
        "accountNumber",
        "accountType",
        "branchCode",
      ] as const) {
        if (!value[key])
          ctx.addIssue({
            code: "custom",
            path: [key],
            message: "Required when bank transfer is enabled",
          });
      }
    if (value.cashEnabled && !value.cashInstructions)
      ctx.addIssue({
        code: "custom",
        path: ["cashInstructions"],
        message: "Add where and when cash payment is accepted",
      });
  });
export type DocumentPayments = z.infer<typeof documentPaymentsSchema>;
export const DEFAULT_DOCUMENT_PAYMENTS = documentPaymentsSchema.parse({});
export const documentPaymentMethods = [
  "none",
  "bank-transfer",
  "cash",
  "bank-transfer-or-cash",
] as const;
