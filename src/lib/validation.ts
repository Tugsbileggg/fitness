// Маягтуудын нийтлэг Zod схемүүд, монгол алдааны мессежтэй.
// Client (react-hook-form) болон server (Server Action) хоёулаа эдгээрийг ашиглана.
import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

export const requiredText = (label: string, max = 120) =>
  z
    .string({ error: `${label} оруулна уу` })
    .trim()
    .min(1, `${label} оруулна уу`)
    .max(max, `${label} ${max} тэмдэгтээс хэтрэхгүй байна`);

export const optionalText = (label: string, max = 500) =>
  z
    .string()
    .trim()
    .max(max, `${label} ${max} тэмдэгтээс хэтрэхгүй байна`)
    .optional()
    .transform((v) => (v ? v : null));

export const emailSchema = z
  .string({ error: "Имэйл хаягаа оруулна уу" })
  .trim()
  .toLowerCase()
  .min(1, "Имэйл хаягаа оруулна уу")
  .pipe(z.email("Имэйл хаяг буруу байна"));

export const passwordSchema = z
  .string({ error: "Нууц үгээ оруулна уу" })
  .min(8, "Нууц үг хамгийн багадаа 8 тэмдэгт байна")
  .max(72, "Нууц үг 72 тэмдэгтээс хэтрэхгүй байна");

export const phoneSchema = z
  .string({ error: "Утасны дугаар оруулна уу" })
  .trim()
  .min(1, "Утасны дугаар оруулна уу")
  .refine((v) => normalizePhone(v) !== null, "Утасны дугаар 8 оронтой байх ёстой")
  .transform((v) => normalizePhone(v)!);

/** Server Action-оос буцах нэгдсэн хариу. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function ok<T>(data: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}

export function fail(error: string, fieldErrors?: Record<string, string>): { ok: false; error: string; fieldErrors?: Record<string, string> } {
  return { ok: false, error, fieldErrors };
}

/** Zod алдааг талбар тус бүрийн эхний мессеж болгоно. */
export function fromZodError(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    fieldErrors[key] ??= issue.message;
  }
  return fail("Маягтын мэдээллийг шалгана уу", fieldErrors);
}

/** Нэвтэрсний дараа буцах замыг зөвхөн дотоод зам байхаар шүүнэ (open redirect-ээс хамгаална). */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
