"use server";

import { revalidatePath } from "next/cache";
import { dbErrorMessage, gymActionContext } from "@/lib/auth/action-context";
import { type ActionResult, fail, fromZodError, ok } from "@/lib/validation";
import { revalidateDirectory } from "@/features/directory/revalidate";
import { planSchema, STARTER_PLANS, type PlanInput, type PlanValues } from "./schemas";

function toRow(values: PlanValues) {
  return {
    name: values.name,
    duration_months: values.durationMonths,
    price: values.price,
    is_active: values.isActive,
  };
}

function revalidate() {
  revalidatePath("/plans");
  // Нийтийн танилцуулгын үнэ эрхийн багцаас харагдана.
  revalidateDirectory();
}

export async function savePlan(planId: string | null, input: PlanInput): Promise<ActionResult> {
  const auth = await gymActionContext({ managerOnly: true });
  if (!auth.ok) return auth;
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  if (planId) {
    const { data, error } = await auth.supabase
      .from("membership_plans")
      .update(toRow(parsed.data))
      .eq("id", planId)
      .eq("gym_id", auth.ctx.gym.id)
      .is("deleted_at", null)
      .select("id");
    if (error) return fail(dbErrorMessage(error));
    if (!data?.length) return fail("Багц олдсонгүй");
  } else {
    const { error } = await auth.supabase
      .from("membership_plans")
      .insert({ gym_id: auth.ctx.gym.id, ...toRow(parsed.data) });
    if (error) return fail(dbErrorMessage(error));
  }

  revalidate();
  return ok(undefined, planId ? "Багц хадгалагдлаа" : "Багц нэмэгдлээ");
}

export async function addStarterPlans(): Promise<ActionResult> {
  const auth = await gymActionContext({ managerOnly: true });
  if (!auth.ok) return auth;
  const { error } = await auth.supabase
    .from("membership_plans")
    .insert(STARTER_PLANS.map((p, i) => ({ ...p, gym_id: auth.ctx.gym.id, sort_order: i })));
  if (error) return fail(dbErrorMessage(error));
  revalidate();
  return ok(undefined, "Жишээ багцууд нэмэгдлээ. Үнийг өөрийн фитнесийнхээр засаарай.");
}

export async function setPlanActive(planId: string, active: boolean): Promise<ActionResult> {
  const auth = await gymActionContext({ managerOnly: true });
  if (!auth.ok) return auth;
  const { data, error } = await auth.supabase
    .from("membership_plans")
    .update({ is_active: active })
    .eq("id", planId)
    .eq("gym_id", auth.ctx.gym.id)
    .select("id");
  if (error) return fail(dbErrorMessage(error));
  if (!data?.length) return fail("Багц олдсонгүй");
  revalidate();
  return ok(undefined, active ? "Багц идэвхжлээ" : "Багц идэвхгүй боллоо");
}

/** Soft delete. Өмнөх төлбөрүүд багцын нэр, үнийг өөрсдөө хадгалдаг тул түүхэнд нөлөөлөхгүй. */
export async function deletePlan(planId: string): Promise<ActionResult> {
  const auth = await gymActionContext({ managerOnly: true });
  if (!auth.ok) return auth;
  const { data, error } = await auth.supabase
    .from("membership_plans")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", planId)
    .eq("gym_id", auth.ctx.gym.id)
    .is("deleted_at", null)
    .select("id");
  if (error) return fail(dbErrorMessage(error));
  if (!data?.length) return fail("Багц олдсонгүй");
  revalidate();
  return ok(undefined, "Багц устгагдлаа");
}
