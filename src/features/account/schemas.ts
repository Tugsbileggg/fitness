import { z } from "zod";
import { normalizePhone } from "@/lib/phone";
import { passwordSchema, requiredText } from "@/lib/validation";

export const profileSchema = z.object({
  fullName: requiredText("Овог нэр", 120),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || normalizePhone(v) !== null, "Утасны дугаар 8 оронтой байх ёстой")
    .transform((v) => (v ? normalizePhone(v) : null)),
});
export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileValues = z.output<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Одоогийн нууц үгээ оруулна уу"),
    password: passwordSchema,
    passwordConfirm: z.string().min(1, "Нууц үгээ давтан оруулна уу"),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Нууц үг таарахгүй байна",
  });
export type ChangePasswordInput = z.input<typeof changePasswordSchema>;
