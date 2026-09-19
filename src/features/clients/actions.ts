"use server";

import { revalidatePath } from "next/cache";
import { dbErrorMessage, gymActionContext } from "@/lib/auth/action-context";
import { type ActionResult, fail, fromZodError, ok } from "@/lib/validation";
import { clientSchema, type ClientInput, type ClientValues } from "./schemas";

function toRow(values: ClientValues) {
  return {
    full_name: values.fullName,
    phone: values.phone,
    gender: values.gender,
    birth_year: values.birthYear,
    assigned_trainer_id: values.assignedTrainerId,
    notes: values.notes,
  };
}

export async function createClientRecord(input: ClientInput): Promise<ActionResult<{ id: string }>> {
  const auth = await gymActionContext();
  if (!auth.ok) return auth;
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const { data, error } = await auth.supabase
    .from("clients")
    .insert({ gym_id: auth.ctx.gym.id, ...toRow(parsed.data) })
    .select("id")
    .single();
  if (error) return fail(dbErrorMessage(error));

  revalidatePath("/clients");
  return ok({ id: data.id }, "Үйлчлүүлэгч бүртгэгдлээ");
}

export async function updateClientRecord(clientId: string, input: ClientInput): Promise<ActionResult> {
  const auth = await gymActionContext();
  if (!auth.ok) return auth;
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const { data, error } = await auth.supabase
    .from("clients")
    .update(toRow(parsed.data))
    .eq("id", clientId)
    .eq("gym_id", auth.ctx.gym.id)
    .is("deleted_at", null)
    .select("id");
  if (error) return fail(dbErrorMessage(error));
  if (!data?.length) return fail("Үйлчлүүлэгч олдсонгүй");

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return ok(undefined, "Хадгаллаа");
}

/** Soft delete: зөвхөн менежер (DB trigger ч шалгана). Төлбөрийн түүх хадгалагдана. */
export async function deleteClientRecord(clientId: string): Promise<ActionResult> {
  const auth = await gymActionContext({ managerOnly: true });
  if (!auth.ok) return auth;

  const { data, error } = await auth.supabase
    .from("clients")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", clientId)
    .eq("gym_id", auth.ctx.gym.id)
    .is("deleted_at", null)
    .select("id");
  if (error) return fail(dbErrorMessage(error));
  if (!data?.length) return fail("Үйлчлүүлэгч олдсонгүй");

  revalidatePath("/clients");
  return ok(undefined, "Үйлчлүүлэгчийг устгалаа");
}
