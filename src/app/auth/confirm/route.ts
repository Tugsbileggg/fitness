import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/validation";

const OTP_TYPES = new Set<EmailOtpType>(["email", "signup", "invite", "recovery", "magiclink", "email_change"]);

/**
 * Имэйл дэх холбоос (баталгаажуулалт, урилга, нууц үг сэргээх) энд ирнэ.
 * token_hash-ийг шалгаад session үүсгэж, `next` зам руу шилжүүлнэ.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));

  if (tokenHash && type && OTP_TYPES.has(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) redirect(next);
  }

  redirect("/login?error=link");
}
