import "server-only";
import { monthRangeISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

const PAYMENT_COLUMNS =
  "id, seq, client_id, plan_name, duration_months, list_price, discount_type, discount_value, discount_amount, amount, paid_on, method, starts_on, ends_on, is_renewal, note, voided_at, void_reason, created_at, recorder:profiles!payments_recorded_by_fkey(full_name)";

/** Үйлчлүүлэгчийн эрх (бүх ажилтан харна). */
export async function getMembership(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_memberships")
    .select("starts_on, ends_on, last_plan_name")
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Үйлчлүүлэгчийн төлбөрийн түүх (зөвхөн менежер; RLS багшид хоосон буцаана). */
export async function listClientPayments(gymId: string, clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select(PAYMENT_COLUMNS)
    .eq("gym_id", gymId)
    .eq("client_id", clientId)
    .order("seq", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Сарын төлбөрүүд ба нийлбэр (менежер). month = "YYYY-MM". */
export async function listMonthPayments(gymId: string, month: string) {
  const supabase = await createClient();
  const [from, to] = monthRangeISO(`${month}-01`);
  const { data, error } = await supabase
    .from("payments")
    .select(`${PAYMENT_COLUMNS}, client:clients!payments_gym_id_client_id_fkey(id, full_name, phone)`)
    .eq("gym_id", gymId)
    .gte("paid_on", from)
    .lte("paid_on", to)
    .order("paid_on", { ascending: false })
    .order("seq", { ascending: false })
    .limit(1000);
  if (error) throw error;

  const rows = data ?? [];
  const valid = rows.filter((p) => !p.voided_at);
  const sum = (items: typeof valid) => items.reduce((acc, p) => acc + Number(p.amount), 0);
  return {
    rows,
    totals: {
      amount: sum(valid),
      count: valid.length,
      cash: sum(valid.filter((p) => p.method === "cash")),
      bank: sum(valid.filter((p) => p.method === "bank_transfer")),
      newCount: valid.filter((p) => !p.is_renewal).length,
      renewalCount: valid.filter((p) => p.is_renewal).length,
    },
  };
}
