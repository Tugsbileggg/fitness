import "server-only";
import { addDaysISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

const ROW_COLUMNS =
  "id, full_name, phone, trainer_name, ends_on, last_plan_name, days_left, status, notice_id, notified_at, notice_note, notified_by_name";

export type AlertRow = {
  id: string;
  full_name: string;
  phone: string;
  trainer_name: string | null;
  ends_on: string;
  last_plan_name: string | null;
  days_left: number;
  notice_id: string | null;
  notified_at: string | null;
  notice_note: string | null;
  notified_by_name: string | null;
};

/** Сүүлийн хэдэн хоногт дууссаныг dashboard-д харуулна (бүгдийг /clients?status=expired-ээс). */
export const RECENT_EXPIRED_DAYS = 30;

export async function getDashboard(gymId: string, today: string) {
  const supabase = await createClient();
  const [summary, expiring, expired] = await Promise.all([
    supabase.rpc("dashboard_summary", { p_gym_id: gymId }).single(),
    supabase
      .from("client_status_v")
      .select(ROW_COLUMNS)
      .eq("gym_id", gymId)
      .eq("status", "expiring")
      .order("days_left")
      .order("full_name")
      .limit(200),
    supabase
      .from("client_status_v")
      .select(ROW_COLUMNS)
      .eq("gym_id", gymId)
      .eq("status", "expired")
      .gte("ends_on", addDaysISO(today, -RECENT_EXPIRED_DAYS))
      .order("ends_on", { ascending: false })
      .order("full_name")
      .limit(200),
  ]);
  if (summary.error) throw summary.error;
  if (expiring.error) throw expiring.error;
  if (expired.error) throw expired.error;

  return {
    summary: summary.data,
    expiring: (expiring.data ?? []) as AlertRow[],
    expired: (expired.data ?? []) as AlertRow[],
  };
}
