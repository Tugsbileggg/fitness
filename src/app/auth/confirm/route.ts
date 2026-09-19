import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/validation";

const OTP_TYPES = new Set<EmailOtpType>(["email", "signup", "invite", "recovery", "magiclink", "email_change"]);

/**
 * Имэйл дэх холбоос энд ирнэ. Хоёр хэлбэрийг дэмжинэ:
 *  1. Манай монгол загвар: ?token_hash=...&type=...  → verifyOtp
 *  2. Supabase-ийн анхдагч загвар (өөрийн SMTP-гүй үед): Supabase /verify хийгээд
 *     ?code=... (PKCE) дамжуулна → exchangeCodeForSession
 * Амжилттай бол session үүсгэж `next` зам руу шилжинэ.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  if (searchParams.get("error") || searchParams.get("error_code")) redirect("/login?error=link");

  const supabase = await createClient();

  if (tokenHash && type && OTP_TYPES.has(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) redirect(next);
    redirect("/login?error=link");
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect(next);
    // Supabase имэйлийг аль хэдийн баталгаажуулсан; холбоосыг өөр төхөөрөмж/хөтөч дээр нээсэн үед
    // PKCE код солилцох боломжгүй тул хэрэглэгч өөрөө нэвтэрнэ.
    redirect(next === "/set-password" ? "/login?error=recovery_device" : "/login?error=confirmed");
  }

  redirect("/login?error=link");
}
