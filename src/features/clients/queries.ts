import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MembershipStatus } from "@/lib/membership";
import { parseClientSearch } from "./search";

export const CLIENTS_PAGE_SIZE = 20;

export const CLIENT_STATUS_FILTERS: Record<MembershipStatus, string> = {
  active: "Идэвхтэй",
  expiring: "Дуусах гэж буй",
  expired: "Дууссан",
  none: "Эрхгүй",
};

export function isStatusFilter(value: unknown): value is MembershipStatus {
  return typeof value === "string" && value in CLIENT_STATUS_FILTERS;
}

export type ClientListFilters = {
  q?: string | null;
  trainerId?: string | null;
  /** "active" = эрх хүчинтэй бүх (дуусах гэж буйг оруулаад), бусад нь яг тухайн төлөв. */
  status?: MembershipStatus | null;
  page?: number;
};

/** client_status_v (security_invoker) нь устгасан үйлчлүүлэгчийг аль хэдийн хасдаг. */
export async function listClients(gymId: string, filters: ClientListFilters) {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * CLIENTS_PAGE_SIZE;

  let query = supabase
    .from("client_status_v")
    .select("id, full_name, phone, gender, birth_year, trainer_name, ends_on, status, days_left", {
      count: "exact",
    })
    .eq("gym_id", gymId);

  const search = parseClientSearch(filters.q);
  if (search?.kind === "phone") query = query.like("phone", search.pattern);
  if (search?.kind === "name") query = query.ilike("full_name", search.pattern);
  if (filters.trainerId === "none") query = query.is("assigned_trainer_id", null);
  else if (filters.trainerId) query = query.eq("assigned_trainer_id", filters.trainerId);
  if (filters.status === "active") query = query.in("status", ["active", "expiring"]);
  else if (filters.status) query = query.eq("status", filters.status);

  if (filters.status === "expiring") query = query.order("days_left");
  if (filters.status === "expired") query = query.order("ends_on", { ascending: false });

  const { data, count, error } = await query
    .order("full_name")
    .order("id")
    .range(from, from + CLIENTS_PAGE_SIZE - 1);
  if (error) throw error;

  return {
    rows: (data ?? []).map((row) => ({ ...row, id: row.id!, full_name: row.full_name!, phone: row.phone! })),
    total: count ?? 0,
    page,
    pageSize: CLIENTS_PAGE_SIZE,
  };
}

export async function getClient(gymId: string, clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, full_name, phone, gender, birth_year, notes, created_at, deleted_at, assigned_trainer_id, trainer:trainers!clients_gym_id_assigned_trainer_id_fkey(full_name, is_active), creator:profiles!clients_created_by_fkey(full_name)",
    )
    .eq("gym_id", gymId)
    .eq("id", clientId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
