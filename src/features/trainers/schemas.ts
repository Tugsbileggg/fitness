import { z } from "zod";
import { normalizePhone } from "@/lib/phone";
import { optionalText, phoneSchema, requiredText } from "@/lib/validation";

export const trainerSchema = z.object({
  fullName: requiredText("Нэр", 120),
  phone: phoneSchema,
  specialization: optionalText("Мэргэшил", 200),
  notes: optionalText("Тэмдэглэл", 1000),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "Имэйл хэт урт байна")
    .optional()
    .refine((v) => !v || z.email().safeParse(v).success, "Имэйл хаяг буруу байна")
    .transform((v) => (v ? v : null)),
});

export type TrainerInput = z.input<typeof trainerSchema>;
export type TrainerValues = z.output<typeof trainerSchema>;

export function trainerFormDefaults(trainer?: {
  full_name: string;
  phone: string;
  specialization: string | null;
  notes: string | null;
  email: string | null;
}): TrainerInput {
  return {
    fullName: trainer?.full_name ?? "",
    phone: trainer?.phone ? (normalizePhone(trainer.phone) ?? trainer.phone) : "",
    specialization: trainer?.specialization ?? "",
    notes: trainer?.notes ?? "",
    email: trainer?.email ?? "",
  };
}
