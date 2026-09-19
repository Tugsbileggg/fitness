import "server-only";
import { monthRangeISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export async function getPlatformSummary() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_platform_summary").single();
  if (error) throw error;
  return data;
}

/** Бүх фитнесийн төлөв, тоон үзүүлэлт (үйлчлүүлэгчийн хувийн мэдээлэлгүй). */
export async function getGymOverview() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_gym_overview");
  if (error) throw error;
  return data ?? [];
}

export type GymOverviewRow = Awaited<ReturnType<typeof getGymOverview>>[number];

export async function getGymDetail(gymId: string) {
  const rows = await getGymOverview();
  return rows.find((r) => r.gym_id === gymId) ?? null;
}

const PAYMENT_COLUMNS =
  "id, seq, gym_id, plan_name, months, amount, paid_on, method, period_start, period_end, note, voided_at, void_reason, created_at, gym:gyms(name), recorder:profiles!platform_payments_recorded_by_fkey(full_name)";

export async function listGymPlatformPayments(gymId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platform_payments")
    .select(PAYMENT_COLUMNS)
    .eq("gym_id", gymId)
    .order("seq", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listMonthPlatformPayments(month: string) {
  const supabase = await createClient();
  const [from, to] = monthRangeISO(`${month}-01`);
  const { data, error } = await supabase
    .from("platform_payments")
    .select(PAYMENT_COLUMNS)
    .gte("paid_on", from)
    .lte("paid_on", to)
    .order("paid_on", { ascending: false })
    .order("seq", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listPlatformPlans() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platform_plans")
    .select("id, name, description, max_clients, monthly_price, is_active, sort_order")
    .order("sort_order")
    .order("monthly_price");
  if (error) throw error;
  return data ?? [];
}
