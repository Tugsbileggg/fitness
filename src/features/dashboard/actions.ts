"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbErrorMessage, gymActionContext } from "@/lib/auth/action-context";
import { isISODate } from "@/lib/dates";
import { type ActionResult, fail, fromZodError, ok } from "@/lib/validation";

const noticeSchema = z.object({
  clientId: z.string().uuid(),
  endsOn: z.string().refine(isISODate),
  note: z.string().trim().max(300, "Тэмдэглэл 300 тэмдэгтээс хэтрэхгүй").optional(),
});

/** "Мэдэгдсэн" гэж тэмдэглэнэ. Тухайн эрхийн мөчлөгт (ends_on) хамаарна. */
export async function markNotified(input: z.input<typeof noticeSchema>): Promise<ActionResult> {
  const auth = await gymActionContext();
  if (!auth.ok) return auth;
  const parsed = noticeSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const { error } = await auth.supabase.from("client_notices").insert({
    gym_id: auth.ctx.gym.id,
    client_id: parsed.data.clientId,
    ends_on: parsed.data.endsOn,
    note: parsed.data.note || null,
  });
  if (error) return fail(dbErrorMessage(error));

  revalidatePath("/dashboard");
  return ok(undefined, "Мэдэгдсэн гэж тэмдэглэлээ");
}

export async function undoNotice(noticeId: string): Promise<ActionResult> {
  const auth = await gymActionContext();
  if (!auth.ok) return auth;

  const { data, error } = await auth.supabase
    .from("client_notices")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", noticeId)
    .eq("gym_id", auth.ctx.gym.id)
    .is("deleted_at", null)
    .select("id");
  if (error) return fail(dbErrorMessage(error));
  if (!data?.length) return fail("Тэмдэглэл олдсонгүй");

  revalidatePath("/dashboard");
  return ok(undefined, "Тэмдэглэлийг буцаалаа");
}
