"use server";

import { revalidatePath } from "next/cache";
import { dbErrorMessage } from "@/lib/auth/action-context";
import { revalidateDirectory } from "@/features/directory/revalidate";
import { getSessionContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult, fail, fromZodError, ok } from "@/lib/validation";
import {
  platformPaymentSchema,
  platformPlanSchema,
  type PlatformPaymentInput,
  type PlatformPlanInput,
} from "./schemas";

async function adminContext() {
  const ctx = await getSessionContext();
  if (!ctx?.isPlatformAdmin) return null;
  return createClient();
}

const DENIED = "Зөвхөн платформын админ энэ үйлдлийг хийнэ.";

function rpcError(error: { code?: string; message?: string }) {
  if (error.message && /[А-Яа-яӨөҮүЁё]/.test(error.message)) return error.message;
  return dbErrorMessage(error);
}

function revalidateGym(gymId?: string) {
  revalidatePath("/admin", "layout");
  if (gymId) revalidatePath(`/admin/gyms/${gymId}`);
  // Баталгаажуулалт, түр зогсоолт, платформын эрх нь нийтийн жагсаалтад гарах эсэхийг тодорхойлно.
  revalidateDirectory();
}

export async function recordPlatformPayment(
  gymId: string,
  input: PlatformPaymentInput,
): Promise<ActionResult<{ periodEnd: string }>> {
  const supabase = await adminContext();
  if (!supabase) return fail(DENIED);
  const parsed = platformPaymentSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const v = parsed.data;

  const { data, error } = await supabase
    .rpc("admin_record_platform_payment", {
      p_gym_id: gymId,
      p_plan_id: v.planId,
      p_months: v.months,
      p_amount: v.amount,
      p_paid_on: v.paidOn,
      p_method: v.method,
      p_note: v.note ?? undefined,
    })
    .single();
  if (error) return fail(rpcError(error));

  revalidateGym(gymId);
  return ok({ periodEnd: data.period_end }, "Платформын төлбөр бүртгэгдлээ");
}

export async function voidPlatformPayment(paymentId: string, gymId: string, reason: string): Promise<ActionResult> {
  const supabase = await adminContext();
  if (!supabase) return fail(DENIED);
  if (reason.trim().length < 3) return fail("Шалтгаанаа бичнэ үү", { reason: "Шалтгаанаа бичнэ үү" });
  const { error } = await supabase.rpc("admin_void_platform_payment", { p_payment_id: paymentId, p_reason: reason });
  if (error) return fail(rpcError(error));
  revalidateGym(gymId);
  return ok(undefined, "Төлбөр хүчингүй боллоо");
}

export async function setGymSuspended(gymId: string, suspended: boolean, reason?: string): Promise<ActionResult> {
  const supabase = await adminContext();
  if (!supabase) return fail(DENIED);
  const { error } = await supabase.rpc("admin_set_gym_suspended", {
    p_gym_id: gymId,
    p_suspended: suspended,
    p_reason: reason ?? undefined,
  });
  if (error) return fail(rpcError(error));
  revalidateGym(gymId);
  return ok(undefined, suspended ? "Фитнесийг түр зогсоолоо" : "Фитнесийг сэргээлээ");
}

export async function setGymVerified(gymId: string, verified: boolean): Promise<ActionResult> {
  const supabase = await adminContext();
  if (!supabase) return fail(DENIED);
  const { error } = await supabase.rpc("admin_set_gym_verified", { p_gym_id: gymId, p_verified: verified });
  if (error) return fail(rpcError(error));
  revalidateGym(gymId);
  return ok(undefined, verified ? "Баталгаажууллаа" : "Баталгаажуулалтыг цуцаллаа");
}

export async function extendTrial(gymId: string, days: number): Promise<ActionResult<{ trialEndsAt: string }>> {
  const supabase = await adminContext();
  if (!supabase) return fail(DENIED);
  const { data, error } = await supabase.rpc("admin_extend_trial", { p_gym_id: gymId, p_days: days });
  if (error) return fail(rpcError(error));
  revalidateGym(gymId);
  return ok({ trialEndsAt: data }, "Туршилт сунгагдлаа");
}

export async function savePlatformPlan(planId: string | null, input: PlatformPlanInput): Promise<ActionResult> {
  const supabase = await adminContext();
  if (!supabase) return fail(DENIED);
  const parsed = platformPlanSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const v = parsed.data;
  const row = {
    name: v.name,
    description: v.description,
    max_clients: v.maxClients,
    monthly_price: v.monthlyPrice,
    sort_order: v.sortOrder,
    is_active: v.isActive,
  };
  const { error } = planId
    ? await supabase.from("platform_plans").update(row).eq("id", planId)
    : await supabase.from("platform_plans").insert(row);
  if (error) return fail(dbErrorMessage(error));
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  return ok(undefined, planId ? "Тариф хадгалагдлаа" : "Тариф нэмэгдлээ");
}
