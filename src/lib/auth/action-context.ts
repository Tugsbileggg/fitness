import "server-only";
import { createClient } from "@/lib/supabase/server";
import { fail } from "@/lib/validation";
import { getSessionContext, type GymContext, type SessionContext } from "./context";

type Ok = { ok: true; ctx: SessionContext & { gym: GymContext }; supabase: Awaited<ReturnType<typeof createClient>> };
type Err = ReturnType<typeof fail>;

/**
 * Server Action-ийн эхэнд дуудна. Redirect хийхгүй, харин хэрэглэгчид ойлгомжтой алдаа буцаана.
 * RLS давхар хамгаалдаг ч эндээс эрт, тодорхой мессежтэй татгалзана.
 */
export async function gymActionContext(options?: {
  managerOnly?: boolean;
  /** false бол read-only (эрх дууссан) үед ч зөвшөөрнө. Анхдагч: true. */
  requireWritable?: boolean;
}): Promise<Ok | Err> {
  const ctx = await getSessionContext();
  if (!ctx) return fail("Нэвтрэх хугацаа дууссан байна. Дахин нэвтэрнэ үү.");
  if (!ctx.gym) return fail("Танд фитнесийн эрх байхгүй байна.");
  if (options?.managerOnly && !ctx.gym.isManager) return fail("Энэ үйлдлийг зөвхөн менежер хийнэ.");
  if ((options?.requireWritable ?? true) && !ctx.gym.isWritable) {
    return fail("Платформын эрх дууссан тул одоогоор зөвхөн харах боломжтой.");
  }
  const supabase = await createClient();
  return { ok: true, ctx: ctx as Ok["ctx"], supabase };
}

/** Postgres алдааны кодыг хэрэглэгчийн мессеж болгоно. */
export function dbErrorMessage(error: { code?: string; message?: string } | null | undefined): string {
  switch (error?.code) {
    case "42501":
      return "Энэ үйлдлийг хийх эрх танд байхгүй байна.";
    case "23503":
      return "Холбогдох бүртгэл олдсонгүй. Хуудсаа сэргээгээд дахин оролдоно уу.";
    case "23505":
      return "Ийм бүртгэл аль хэдийн байна.";
    case "23514":
      return "Оруулсан мэдээлэл буруу байна.";
    default:
      return "Хадгалахад алдаа гарлаа. Дахин оролдоно уу.";
  }
}
