import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Нэвтрээгүй (anon) client, cookie уншихгүй. Нийтийн хуудсууд (нүүр, фитнес хайх) ISR-ээр
 * кэшлэгдэх боломжтой байхын тулд хэрэглэгчийн session-оос хамаарахгүй.
 */
export function createPublicClient() {
  return createClient<Database>(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
