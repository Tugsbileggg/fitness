import "server-only";
import { createClient } from "@/lib/supabase/server";

export type TrainerAccountStatus =
  | { kind: "none" }
  | { kind: "invited"; invitedAt: string | null }
  | { kind: "active"; lastSignInAt: string | null };

export type TrainerRow = {
  id: string;
  full_name: string;
  phone: string;
  specialization: string | null;
  notes: string | null;
  email: string | null;
  user_id: string | null;
  invited_at: string | null;
  is_active: boolean;
  created_at: string;
};

const TRAINER_COLUMNS =
  "id, full_name, phone, specialization, notes, email, user_id, invited_at, is_active, created_at";

/** Фитнесийн бүх багш (идэвхтэй нь эхэнд) + нэвтрэх эрхийн төлөв (менежерт л харагдана). */
export async function listTrainers(gymId: string, withAccounts: boolean) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trainers")
    .select(TRAINER_COLUMNS)
    .eq("gym_id", gymId)
    .order("is_active", { ascending: false })
    .order("full_name");
  if (error) throw error;

  const accounts = new Map<string, { email_confirmed: boolean; last_sign_in_at: string | null }>();
  if (withAccounts) {
    const { data: rows } = await supabase.rpc("trainer_accounts", { p_gym_id: gymId });
    for (const row of rows ?? []) accounts.set(row.trainer_id, row);
  }

  return (data ?? []).map((t) => ({ ...t, account: accountStatus(t, accounts.get(t.id)) }));
}

export async function getTrainer(gymId: string, trainerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trainers")
    .select(TRAINER_COLUMNS)
    .eq("gym_id", gymId)
    .eq("id", trainerId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: rows } = await supabase.rpc("trainer_accounts", { p_gym_id: gymId });
  const account = rows?.find((r) => r.trainer_id === trainerId);
  return { ...data, account: accountStatus(data, account) };
}

/** Үйлчлүүлэгчийн маягтад: идэвхтэй багш нар (+ одоо хариуцаж буй идэвхгүй багш). */
export async function trainerOptions(gymId: string, includeId?: string | null) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trainers")
    .select("id, full_name, is_active")
    .eq("gym_id", gymId)
    .order("full_name");
  if (error) throw error;
  return (data ?? []).filter((t) => t.is_active || t.id === includeId);
}

function accountStatus(
  trainer: Pick<TrainerRow, "user_id" | "invited_at">,
  account?: { email_confirmed: boolean; last_sign_in_at: string | null },
): TrainerAccountStatus {
  if (!trainer.user_id) return { kind: "none" };
  if (account?.email_confirmed || account?.last_sign_in_at) {
    return { kind: "active", lastSignInAt: account.last_sign_in_at };
  }
  return { kind: "invited", invitedAt: trainer.invited_at };
}
