import "server-only";
import { createClient } from "@/lib/supabase/server";

export type PlanRow = {
  id: string;
  name: string;
  duration_months: number;
  price: number;
  is_active: boolean;
  sort_order: number;
};

/** Устгаагүй бүх багц (идэвхгүй нь ч). activeOnly = төлбөрийн маягтад. */
export async function listPlans(gymId: string, activeOnly = false): Promise<PlanRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("membership_plans")
    .select("id, name, duration_months, price, is_active, sort_order")
    .eq("gym_id", gymId)
    .is("deleted_at", null);
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query.order("duration_months").order("price").order("name");
  if (error) throw error;
  return data ?? [];
}
