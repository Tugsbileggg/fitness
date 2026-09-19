"use server";

import { revalidatePath } from "next/cache";
import { dbErrorMessage, gymActionContext } from "@/lib/auth/action-context";
import { type ActionResult, fail, fromZodError, ok } from "@/lib/validation";
import { paymentSchema, voidSchema, type PaymentInput } from "./schemas";

/** DB-ийн RPC монгол мессежтэй алдаа шиддэг (P0002, 22023, 42501); бусдыг ерөнхий мессеж болгоно. */
function rpcError(error: { code?: string; message?: string }) {
  if (error.message && /[А-Яа-яӨөҮүЁё]/.test(error.message)) return error.message;
  return dbErrorMessage(error);
}

function revalidateClient(clientId: string) {
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  revalidatePath("/dashboard");
  revalidatePath("/payments");
}

export async function recordPayment(
  clientId: string,
  input: PaymentInput,
): Promise<ActionResult<{ endsOn: string; amount: number; isRenewal: boolean }>> {
  const auth = await gymActionContext();
  if (!auth.ok) return auth;
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const v = parsed.data;

  const { data, error } = await auth.supabase
    .rpc("record_payment", {
      p_client_id: clientId,
      p_plan_id: v.planId,
      p_paid_on: v.paidOn,
      p_method: v.method,
      p_discount_type: v.discountType,
      p_discount_value: v.discountValue,
      p_note: v.note ?? undefined,
    })
    .single();
  if (error) return fail(rpcError(error));

  revalidateClient(clientId);
  return ok({ endsOn: data.ends_on, amount: Number(data.amount), isRenewal: data.is_renewal });
}

export async function voidPayment(
  paymentId: string,
  clientId: string,
  input: { reason: string },
): Promise<ActionResult> {
  const auth = await gymActionContext({ managerOnly: true });
  if (!auth.ok) return auth;
  const parsed = voidSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const { error } = await auth.supabase.rpc("void_payment", {
    p_payment_id: paymentId,
    p_reason: parsed.data.reason,
  });
  if (error) return fail(rpcError(error));

  revalidateClient(clientId);
  return ok(undefined, "Төлбөр хүчингүй боллоо");
}
