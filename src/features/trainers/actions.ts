"use server";

import { revalidatePath } from "next/cache";
import { dbErrorMessage, gymActionContext } from "@/lib/auth/action-context";
import { publicEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { type ActionResult, fail, fromZodError, ok } from "@/lib/validation";
import { trainerSchema, type TrainerInput } from "./schemas";

function toRow(values: ReturnType<typeof trainerSchema.parse>) {
  return {
    full_name: values.fullName,
    phone: values.phone,
    specialization: values.specialization,
    notes: values.notes,
    email: values.email,
  };
}

export async function createTrainer(input: TrainerInput): Promise<ActionResult<{ id: string }>> {
  const auth = await gymActionContext({ managerOnly: true });
  if (!auth.ok) return auth;
  const parsed = trainerSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const { data, error } = await auth.supabase
    .from("trainers")
    .insert({ gym_id: auth.ctx.gym.id, ...toRow(parsed.data) })
    .select("id")
    .single();
  if (error) return fail(dbErrorMessage(error));

  revalidatePath("/trainers");
  return ok({ id: data.id }, "Багш бүртгэгдлээ");
}

export async function updateTrainer(trainerId: string, input: TrainerInput): Promise<ActionResult> {
  const auth = await gymActionContext({ managerOnly: true });
  if (!auth.ok) return auth;
  const parsed = trainerSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const { data, error } = await auth.supabase
    .from("trainers")
    .update(toRow(parsed.data))
    .eq("id", trainerId)
    .eq("gym_id", auth.ctx.gym.id)
    .select("id");
  if (error) return fail(dbErrorMessage(error));
  if (!data?.length) return fail("Багш олдсонгүй");

  revalidatePath("/trainers");
  revalidatePath(`/trainers/${trainerId}`);
  return ok(undefined, "Хадгаллаа");
}

/** Идэвхгүй болгоход DB trigger нэвтрэх эрхийг нь мөн хаана (устгахгүй). */
export async function setTrainerActive(trainerId: string, active: boolean): Promise<ActionResult> {
  const auth = await gymActionContext({ managerOnly: true });
  if (!auth.ok) return auth;

  const { data, error } = await auth.supabase
    .from("trainers")
    .update({ is_active: active })
    .eq("id", trainerId)
    .eq("gym_id", auth.ctx.gym.id)
    .select("id");
  if (error) return fail(dbErrorMessage(error));
  if (!data?.length) return fail("Багш олдсонгүй");

  revalidatePath("/trainers");
  revalidatePath(`/trainers/${trainerId}`);
  return ok(undefined, active ? "Багшийг идэвхжүүллээ" : "Багшийг идэвхгүй болголоо");
}

/**
 * Багшид имэйлээр урилга илгээж нэвтрэх эрх олгоно.
 * Багшийн бүртгэлийг эхлээд менежерийн эрхээр (RLS) уншиж өөрийн фитнесийнх гэдгийг баталгаажуулна.
 * Дараа нь secret key-ээр Auth хэрэглэгч үүсгэж, фитнест багш дүрээр холбоно.
 */
export async function inviteTrainer(trainerId: string): Promise<ActionResult> {
  const auth = await gymActionContext({ managerOnly: true });
  if (!auth.ok) return auth;

  const { data: trainer, error } = await auth.supabase
    .from("trainers")
    .select("id, gym_id, full_name, email, user_id, is_active")
    .eq("id", trainerId)
    .eq("gym_id", auth.ctx.gym.id)
    .maybeSingle();
  if (error) return fail(dbErrorMessage(error));
  if (!trainer) return fail("Багш олдсонгүй");
  if (!trainer.is_active) return fail("Идэвхгүй багшид урилга илгээх боломжгүй");
  if (!trainer.email) return fail("Эхлээд багшийн имэйл хаягийг оруулж хадгална уу");

  const admin = createAdminClient();

  if (trainer.user_id) {
    const { data: existing } = await admin.auth.admin.getUserById(trainer.user_id);
    if (existing.user?.email_confirmed_at) return fail("Энэ багш аль хэдийн нэвтэрдэг болсон байна");
    if (existing.user && existing.user.email !== trainer.email) {
      return fail("Урилга илгээсний дараа имэйл өөрчлөгдсөн байна. Хуучин имэйл рүү дахин илгээх боломжгүй.");
    }
  }

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(trainer.email, {
    data: { full_name: trainer.full_name, gym_name: auth.ctx.gym.name },
    // Анхдагч загвар session-ийг #hash-аар дамжуулдаг тул browser дээрх /auth/callback хүлээн авна.
    redirectTo: `${publicEnv.siteUrl}/auth/callback?next=/set-password`,
  });
  if (inviteError) {
    if (inviteError.code === "email_exists" || inviteError.status === 422) {
      return fail("Энэ имэйлээр өөр бүртгэл үүссэн байна. Багшид өөр имэйл хаяг ашиглана уу.");
    }
    if (inviteError.code?.startsWith("over_")) {
      return fail("Хэт олон имэйл илгээлээ. Хэдэн минутын дараа дахин оролдоно уу.");
    }
    return fail("Урилга илгээхэд алдаа гарлаа. Дахин оролдоно уу.");
  }

  const userId = invited.user.id;
  const { error: memberError } = await admin
    .from("gym_users")
    .upsert(
      { gym_id: trainer.gym_id, user_id: userId, role: "trainer", is_active: true },
      { onConflict: "gym_id,user_id" },
    );
  if (memberError) return fail(dbErrorMessage(memberError));

  const { error: linkError } = await admin
    .from("trainers")
    .update({ user_id: userId, invited_at: new Date().toISOString() })
    .eq("id", trainer.id)
    .eq("gym_id", trainer.gym_id);
  if (linkError) return fail(dbErrorMessage(linkError));

  revalidatePath("/trainers");
  revalidatePath(`/trainers/${trainerId}`);
  return ok(undefined, `Урилга ${trainer.email} хаяг руу илгээгдлээ`);
}
