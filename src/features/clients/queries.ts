import "server-only";
import { createClient } from "@/lib/supabase/server";
import { parseClientSearch } from "./search";

export const CLIENTS_PAGE_SIZE = 20;

export type ClientListFilters = {
  q?: string | null;
  trainerId?: string | null;
  page?: number;
};

const LIST_COLUMNS =
  "id, full_name, phone, gender, birth_year, created_at, assigned_trainer_id, trainer:trainers!clients_gym_id_assigned_trainer_id_fkey(full_name)";

export async function listClients(gymId: string, filters: ClientListFilters) {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * CLIENTS_PAGE_SIZE;

  let query = supabase
    .from("clients")
    .select(LIST_COLUMNS, { count: "exact" })
    .eq("gym_id", gymId)
    .is("deleted_at", null);

  const search = parseClientSearch(filters.q);
  if (search?.kind === "phone") query = query.like("phone", search.pattern);
  if (search?.kind === "name") query = query.ilike("full_name", search.pattern);
  if (filters.trainerId === "none") query = query.is("assigned_trainer_id", null);
  else if (filters.trainerId) query = query.eq("assigned_trainer_id", filters.trainerId);

  const { data, count, error } = await query
    .order("full_name")
    .order("id")
    .range(from, from + CLIENTS_PAGE_SIZE - 1);
  if (error) throw error;

  return { rows: data ?? [], total: count ?? 0, page, pageSize: CLIENTS_PAGE_SIZE };
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
