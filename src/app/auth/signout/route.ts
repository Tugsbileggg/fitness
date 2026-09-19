import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Session-ийг цэвэрлээд /login руу шилжүүлнэ.
 * JWT хүчинтэй боловч хэрэглэгч DB-д байхгүй (устгагдсан) үед /login ↔ /dashboard
 * гогцоо үүсэхээс сэргийлнэ. `local` scope: сервер рүү хандахгүй, зөвхөн cookie устгана.
 */
export async function GET() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
