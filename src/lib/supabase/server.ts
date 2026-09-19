import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Server Component, Server Action, Route Handler-т зориулсан client.
 * Хэрэглэгчийн session-оор ажилладаг тул бүх query RLS-д захирагдана.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component-оос cookie бичих боломжгүй. Session-ийг proxy.ts шинэчилдэг тул болно.
        }
      },
    },
  });
}
