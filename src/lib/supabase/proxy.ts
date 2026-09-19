import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

// Нэвтрэх шаардлагатай замууд. Дүрийн нарийн шалгалтыг layout, Server Action, RLS хийнэ;
// proxy зөвхөн session-ийг шинэчилж, нэвтрээгүй хэрэглэгчийг /login руу чиглүүлнэ.
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/clients",
  "/trainers",
  "/plans",
  "/payments",
  "/settings",
  "/billing",
  "/account",
  "/admin",
  "/set-password",
  "/no-access",
];

const GUEST_ONLY = ["/login", "/register"];

function matches(path: string, prefixes: string[]) {
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [key, value] of Object.entries(headers ?? {})) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  // getClaims() нь JWT-г шалгаж, шаардлагатай бол token-ийг шинэчилнэ. Энэ дуудлагаас өмнө
  // өөр код бүү оруул: session санамсаргүй тасрах алдаа гардаг.
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims?.sub);
  const path = request.nextUrl.pathname;

  const redirectTo = (pathname: string, params?: Record<string, string>) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v);
    const redirect = NextResponse.redirect(url);
    // Шинэчлэгдсэн session cookie-г redirect хариунд ч дамжуулна.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  };

  if (!isSignedIn && matches(path, PROTECTED_PREFIXES)) {
    return redirectTo("/login", { next: path + request.nextUrl.search });
  }
  if (isSignedIn && matches(path, GUEST_ONLY)) {
    return redirectTo("/dashboard");
  }

  return response;
}
