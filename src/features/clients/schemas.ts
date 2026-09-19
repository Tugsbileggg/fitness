import { z } from "zod";
import { todayUB } from "@/lib/dates";
import { optionalText, phoneSchema, requiredText } from "@/lib/validation";

export const GENDER_LABELS = { male: "Эрэгтэй", female: "Эмэгтэй" } as const;
export type Gender = keyof typeof GENDER_LABELS;

const currentYear = () => Number(todayUB().slice(0, 4));

export const clientSchema = z.object({
  fullName: requiredText("Нэр", 120),
  phone: phoneSchema,
  gender: z.enum(["male", "female"], { error: "Хүйсээ сонгоно уу" }),
  birthYear: z
    .string({ error: "Төрсөн оноо оруулна уу" })
    .trim()
    .min(1, "Төрсөн оноо оруулна уу")
    .regex(/^\d{4}$/, "Төрсөн оныг 4 оронтой тоогоор оруулна уу (жишээ нь 1995)")
    .transform(Number)
    .refine((y) => y >= 1920 && y <= currentYear(), "Төрсөн он буруу байна"),
  assignedTrainerId: z
    .string()
    .optional()
    .transform((v) => (v && v !== "none" ? v : null)),
  notes: optionalText("Тэмдэглэл", 1000),
});

export type ClientInput = z.input<typeof clientSchema>;
export type ClientValues = z.output<typeof clientSchema>;

export function clientFormDefaults(client?: {
  full_name: string;
  phone: string;
  gender: Gender;
  birth_year: number;
  assigned_trainer_id: string | null;
  notes: string | null;
}): ClientInput {
  return {
    fullName: client?.full_name ?? "",
    phone: client?.phone ?? "",
    gender: client?.gender ?? (undefined as unknown as Gender),
    birthYear: client ? String(client.birth_year) : "",
    assignedTrainerId: client?.assigned_trainer_id ?? "none",
    notes: client?.notes ?? "",
  };
}

/** Төрсөн оноос нас (энэ онд хүрэх нас). */
export function ageFromBirthYear(birthYear: number, today = todayUB()) {
  return Number(today.slice(0, 4)) - birthYear;
}
