"use server";

import { redirect } from "next/navigation";
import { publicEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  type ActionResult,
  fail,
  fromZodError,
  ok,
  safeNextPath,
} from "@/lib/validation";
import { authErrorMessage } from "./errors";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  setPasswordSchema,
  validateLogo,
  type ForgotPasswordInput,
  type LoginInput,
  type SetPasswordInput,
} from "./schemas";

export async function signIn(input: LoginInput, next?: string | null): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return fail(authErrorMessage(error));

  redirect(safeNextPath(next));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Фитнес бүртгүүлэх. Файл (лого) дамжуулдаг тул FormData хүлээн авна.
 * Фитнес, менежерийн эрх, туршилтын хугацааг DB trigger (app.handle_new_user) нэг транзакцаар үүсгэнэ.
 */
export async function registerGym(formData: FormData): Promise<ActionResult> {
  const text = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };
  const parsed = registerSchema.safeParse({
    gymName: text("gymName"),
    gymAddress: text("gymAddress"),
    gymPhone: text("gymPhone"),
    managerName: text("managerName"),
    email: text("email"),
    password: text("password"),
    passwordConfirm: text("passwordConfirm"),
  });
  if (!parsed.success) return fromZodError(parsed.error);

  const logoValue = formData.get("logo");
  const logo = logoValue instanceof File && logoValue.size > 0 ? logoValue : null;
  const logoError = validateLogo(logo);
  if (logoError) return fail(logoError, { logo: logoError });

  const input = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${publicEnv.siteUrl}/dashboard`,
      data: {
        signup_type: "gym_owner",
        full_name: input.managerName,
        gym_name: input.gymName,
        gym_address: input.gymAddress,
        gym_phone: input.gymPhone,
      },
    },
  });

  if (error) return fail(authErrorMessage(error));
  // Supabase нь аль хэдийн бүртгэлтэй имэйлд алдаа биш, identities хоосон хэрэглэгч буцаадаг.
  if (!data.user || data.user.identities?.length === 0) {
    return fail(authErrorMessage({ code: "user_already_exists", message: "", status: 400 }), {
      email: "Энэ имэйлээр бүртгэл үүссэн байна",
    });
  }

  if (logo) {
    try {
      await uploadInitialLogo(data.user.id, logo);
    } catch (e) {
      // Лого байршуулж чадаагүй ч бүртгэл хүчинтэй. Менежер дараа нь тохиргооноос оруулж болно.
      console.error("Бүртгэлийн үеийн лого байршуулалт амжилтгүй", e);
    }
  }

  // Имэйл баталгаажуулалт унтраалттай орчинд шууд нэвтэрсэн байна.
  if (data.session) redirect("/dashboard");
  redirect("/register/check-email");
}

/** Шинэ хэрэглэгч имэйлээ баталгаажуулаагүй (session-гүй) тул secret key-ээр байршуулна. */
async function uploadInitialLogo(userId: string, file: File) {
  const admin = createAdminClient();
  const { data: membership, error } = await admin
    .from("gym_users")
    .select("gym_id")
    .eq("user_id", userId)
    .eq("role", "manager")
    .single();
  if (error || !membership) throw error ?? new Error("Фитнес олдсонгүй");

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${membership.gym_id}/logo-${Date.now()}.${ext}`;
  const { error: uploadError } = await admin.storage
    .from("gym-logos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;

  const { error: updateError } = await admin
    .from("gyms")
    .update({ logo_path: path })
    .eq("id", membership.gym_id);
  if (updateError) throw updateError;
}

export async function requestPasswordReset(input: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${publicEnv.siteUrl}/set-password`,
  });
  if (error && error.code?.startsWith("over_")) return fail(authErrorMessage(error));

  // Бүртгэлтэй эсэхийг ил гаргахгүйн тулд үргэлж ижил хариу өгнө.
  return ok(undefined, "Хэрэв энэ имэйлээр бүртгэл байгаа бол нууц үг сэргээх холбоос илгээлээ.");
}

export async function updatePassword(input: SetPasswordInput): Promise<ActionResult> {
  const parsed = setPasswordSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    return fail("Холбоосны хугацаа дууссан байна. Нууц үг сэргээх хүсэлтээ дахин илгээнэ үү.");
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return fail(authErrorMessage(error));

  redirect("/dashboard");
}
