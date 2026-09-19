"use server";

import { revalidatePath } from "next/cache";
import { authErrorMessage } from "@/features/auth/errors";
import { dbErrorMessage } from "@/lib/auth/action-context";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult, fail, fromZodError, ok } from "@/lib/validation";
import { changePasswordSchema, profileSchema, type ChangePasswordInput, type ProfileInput } from "./schemas";

async function currentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  return claims?.sub ? { supabase, id: claims.sub, email: claims.email as string | undefined } : null;
}

/** Өөрийн нэр, утас. Эрх дууссан фитнест ч засаж болно (profiles нь фитнесийн өгөгдөл биш). */
export async function updateProfile(input: ProfileInput): Promise<ActionResult> {
  const user = await currentUser();
  if (!user) return fail("Нэвтрэх хугацаа дууссан байна. Дахин нэвтэрнэ үү.");
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const { error } = await user.supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName, phone: parsed.data.phone })
    .eq("id", user.id);
  if (error) return fail(dbErrorMessage(error));

  revalidatePath("/", "layout");
  return ok(undefined, "Мэдээлэл хадгалагдлаа");
}

/** Одоогийн нууц үгийг шалгасны дараа солино (утсаа үлдээсэн үед өөр хүн солихоос сэргийлнэ). */
export async function changePassword(input: ChangePasswordInput): Promise<ActionResult> {
  const user = await currentUser();
  if (!user?.email) return fail("Нэвтрэх хугацаа дууссан байна. Дахин нэвтэрнэ үү.");
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const { error: verifyError } = await user.supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (verifyError) {
    return fail("Одоогийн нууц үг буруу байна", { currentPassword: "Одоогийн нууц үг буруу байна" });
  }

  const { error } = await user.supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return fail(authErrorMessage(error));
  return ok(undefined, "Нууц үг солигдлоо");
}
