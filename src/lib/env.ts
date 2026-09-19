// Орчны хувьсагчид. NEXT_PUBLIC_* утгуудыг Next.js build-ийн үед орлуулдаг тул
// `process.env.NEXT_PUBLIC_X` гэж шууд бичих ёстой (динамикаар уншиж болохгүй).

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `${name} орчны хувьсагч тохируулагдаагүй байна. .env.example-г .env.local болгон хуулж бөглөнө үү.`,
    );
  }
  return value;
}

export const publicEnv = {
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get supabasePublishableKey() {
    return required(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
  },
  get siteUrl() {
    return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  },
};
