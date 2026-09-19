import { z } from "zod";
import { isISODate } from "@/lib/dates";
import { parseMNT } from "@/lib/money";
import { optionalText, requiredText } from "@/lib/validation";

const money = (label: string) =>
  z
    .string({ error: `${label} оруулна уу` })
    .trim()
    .min(1, `${label} оруулна уу`)
    .refine((v) => parseMNT(v) !== null, `${label} тоогоор оруулна уу`)
    .transform((v) => parseMNT(v)!)
    .refine((n) => n <= 100_000_000, `${label} хэт их байна`);

export const platformPaymentSchema = z.object({
  planId: z.string().uuid("Тариф сонгоно уу"),
  months: z
    .string()
    .trim()
    .regex(/^\d{1,2}$/, "Сарын тоог оруулна уу")
    .transform(Number)
    .refine((n) => n >= 1 && n <= 24, "1-24 сар"),
  amount: money("Дүн"),
  paidOn: z.string().refine(isISODate, "Огноо буруу байна"),
  method: z.enum(["cash", "bank_transfer"]),
  note: optionalText("Тэмдэглэл", 500),
});
export type PlatformPaymentInput = z.input<typeof platformPaymentSchema>;
export type PlatformPaymentValues = z.output<typeof platformPaymentSchema>;

export const platformPlanSchema = z.object({
  name: requiredText("Нэр", 60).refine((v) => v.length >= 2, "Нэр хэт богино"),
  description: optionalText("Тайлбар", 300),
  maxClients: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^\d{1,6}$/.test(v), "Тоогоор оруулна уу")
    .transform((v) => (v ? Number(v) : null))
    .refine((v) => v === null || v > 0, "0-ээс их байна"),
  monthlyPrice: money("Сарын үнэ"),
  sortOrder: z
    .string()
    .trim()
    .regex(/^\d{0,3}$/, "Тоогоор оруулна уу")
    .transform((v) => Number(v || 0)),
  isActive: z.boolean(),
});
export type PlatformPlanInput = z.input<typeof platformPlanSchema>;
export type PlatformPlanValues = z.output<typeof platformPlanSchema>;
