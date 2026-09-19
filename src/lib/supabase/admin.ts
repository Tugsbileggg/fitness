import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Secret key-тэй client. RLS-ийг ТОЙРДОГ.
 * Зөвхөн дүрийг нь урьдчилан шалгасан Server Action дотор, хязгаарлагдмал үйлдэлд ашиглана:
 * багш урих, бүртгэлийн үеийн лого байршуулах, seed.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY орчны хувьсагч тохируулагдаагүй байна.");
  }
  return createClient<Database>(publicEnv.supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
