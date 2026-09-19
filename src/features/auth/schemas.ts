import { z } from "zod";
import { emailSchema, passwordSchema, phoneSchema, requiredText } from "@/lib/validation";

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Нууц үгээ оруулна уу"),
});
export type LoginInput = z.input<typeof loginSchema>;

export const registerSchema = z
  .object({
    gymName: requiredText("Фитнесийн нэр", 120).refine((v) => v.length >= 2, "Нэр хэт богино байна"),
    gymAddress: requiredText("Хаяг", 300).refine((v) => v.length >= 3, "Хаягаа бүрэн оруулна уу"),
    gymPhone: phoneSchema,
    managerName: requiredText("Менежерийн нэр", 120),
    email: emailSchema,
    password: passwordSchema,
    passwordConfirm: z.string().min(1, "Нууц үгээ давтан оруулна уу"),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Нууц үг таарахгүй байна",
  });
export type RegisterInput = z.input<typeof registerSchema>;

export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export function validateLogo(file: File | null | undefined): string | null {
  if (!file || file.size === 0) return null;
  if (!LOGO_TYPES.includes(file.type as (typeof LOGO_TYPES)[number])) {
    return "Лого PNG, JPG эсвэл WEBP зураг байх ёстой";
  }
  if (file.size > LOGO_MAX_BYTES) return "Логоны хэмжээ 2MB-аас ихгүй байна";
  return null;
}

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;

export const setPasswordSchema = z
  .object({
    password: passwordSchema,
    passwordConfirm: z.string().min(1, "Нууц үгээ давтан оруулна уу"),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Нууц үг таарахгүй байна",
  });
export type SetPasswordInput = z.input<typeof setPasswordSchema>;
