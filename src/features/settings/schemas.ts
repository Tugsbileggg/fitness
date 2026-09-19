import { z } from "zod";
import { phoneSchema, requiredText } from "@/lib/validation";

export const gymSettingsSchema = z.object({
  name: requiredText("Фитнесийн нэр", 120).refine((v) => v.length >= 2, "Нэр хэт богино байна"),
  address: requiredText("Хаяг", 300).refine((v) => v.length >= 3, "Хаягаа бүрэн оруулна уу"),
  phone: phoneSchema,
  expiringThresholdDays: z
    .string()
    .trim()
    .regex(/^\d{1,2}$/, "Хоногийг бүхэл тоогоор оруулна уу")
    .transform(Number)
    .refine((n) => n >= 1 && n <= 60, "1-60 хоногийн хооронд байна"),
});

export type GymSettingsInput = z.input<typeof gymSettingsSchema>;
export type GymSettingsValues = z.output<typeof gymSettingsSchema>;

/** Storage-д байршуулсан логоны зам: {gym_id}/logo-{timestamp}.{ext} */
export function isValidLogoPath(path: string, gymId: string) {
  return new RegExp(`^${gymId}/logo-\\d{10,16}\\.(png|jpg|webp)$`).test(path);
}
