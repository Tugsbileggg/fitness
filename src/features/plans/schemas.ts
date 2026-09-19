import { z } from "zod";
import { parseMNT } from "@/lib/money";
import { requiredText } from "@/lib/validation";

export const planSchema = z.object({
  name: requiredText("Багцын нэр", 80),
  durationMonths: z
    .string({ error: "Хугацаагаа оруулна уу" })
    .trim()
    .regex(/^\d{1,2}$/, "Хугацааг сараар бүхэл тоогоор оруулна уу")
    .transform(Number)
    .refine((n) => n >= 1 && n <= 36, "Хугацаа 1-36 сарын хооронд байна"),
  price: z
    .string({ error: "Үнээ оруулна уу" })
    .trim()
    .min(1, "Үнээ оруулна уу")
    .refine((v) => parseMNT(v) !== null, "Үнийг тоогоор оруулна уу")
    .transform((v) => parseMNT(v)!)
    .refine((n) => n <= 100_000_000, "Үнэ хэт их байна"),
  isActive: z.boolean(),
});

export type PlanInput = z.input<typeof planSchema>;
export type PlanValues = z.output<typeof planSchema>;

export function planFormDefaults(plan?: {
  name: string;
  duration_months: number;
  price: number;
  is_active: boolean;
}): PlanInput {
  return {
    name: plan?.name ?? "",
    durationMonths: plan ? String(plan.duration_months) : "1",
    price: plan ? String(plan.price) : "",
    isActive: plan?.is_active ?? true,
  };
}

/** "Түгээмэл багцууд нэмэх" товчны жишээ үнэ. Менежер дараа нь засна. */
export const STARTER_PLANS = [
  { name: "1 сар", duration_months: 1, price: 80000 },
  { name: "3 сар", duration_months: 3, price: 210000 },
  { name: "6 сар", duration_months: 6, price: 390000 },
  { name: "1 жил", duration_months: 12, price: 720000 },
];
