import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { PLATFORM_WARNING_DAYS } from "@/lib/config";
import { diffDaysISO } from "@/lib/dates";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database.types";

export type StaffRole = Enums<"staff_role">;
export type SubscriptionStatus = Enums<"gym_subscription_status">;

export type GymContext = {
  id: string;
  name: string;
  logoUrl: string | null;
  expiringThresholdDays: number;
  role: StaffRole;
  isManager: boolean;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  paidUntil: string | null;
  /** Туршилт эсвэл төлсөн эрхийн аль хожуу нь. */
  accessEndsOn: string | null;
  /** accessEndsOn хүртэл үлдсэн хоног (өнгөрсөн бол сөрөг). */
  accessDaysLeft: number | null;
  /** past_due / suspended үед false: өгөгдлийг зөвхөн уншина. */
  isWritable: boolean;
  /** Платформын эрх дуусахад ≤5 хоног үлдсэн (менежерт анхааруулга). */
  showRenewalWarning: boolean;
};

export type SessionContext = {
  userId: string;
  fullName: string;
  isPlatformAdmin: boolean;
  today: string;
  gym: GymContext | null;
};

export function gymLogoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${publicEnv.supabaseUrl}/storage/v1/object/public/gym-logos/${path}`;
}

/**
 * Нэвтэрсэн хэрэглэгчийн мэдээлэл, фитнес, дүр, платформын төлөв. Нэг хүсэлтэд нэг л удаа DB-д хандана.
 * Нэвтрээгүй бол null.
 */
export const getSessionContext = cache(async (): Promise<SessionContext | null> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return null;

  const { data, error } = await supabase.rpc("get_my_context").maybeSingle();
  if (error) throw new Error(`Хэрэглэгчийн мэдээлэл уншихад алдаа гарлаа: ${error.message}`);
  if (!data) return null;

  let gym: GymContext | null = null;
  if (data.gym_id && data.role && data.subscription_status) {
    const accessDaysLeft = data.access_ends_on ? diffDaysISO(data.today, data.access_ends_on) : null;
    const isWritable = data.subscription_status === "trial" || data.subscription_status === "active";
    gym = {
      id: data.gym_id,
      name: data.gym_name ?? "",
      logoUrl: gymLogoUrl(data.gym_logo_path),
      expiringThresholdDays: data.expiring_threshold_days ?? 7,
      role: data.role,
      isManager: data.role === "manager",
      status: data.subscription_status,
      trialEndsAt: data.trial_ends_at,
      paidUntil: data.paid_until,
      accessEndsOn: data.access_ends_on,
      accessDaysLeft,
      isWritable,
      showRenewalWarning:
        isWritable && accessDaysLeft !== null && accessDaysLeft <= PLATFORM_WARNING_DAYS,
    };
  }

  return {
    userId: data.user_id,
    fullName: data.full_name,
    isPlatformAdmin: data.is_platform_admin,
    today: data.today,
    gym,
  };
});

type WithGym = SessionContext & { gym: GymContext };

/**
 * Фитнесийн хэсгийн хуудас, Server Action-д. Нэвтрээгүй бол /auth/signout → /login, фитнесгүй админ бол /admin,
 * идэвхтэй эрхгүй бол /no-access руу. managerOnly үед багшийг /dashboard руу буцаана.
 */
export async function requireGymContext(options?: { managerOnly?: boolean }): Promise<WithGym> {
  const ctx = await getSessionContext();
  // Session байхгүй эсвэл хэрэглэгч DB-д олдоогүй: cookie-г цэвэрлээд /login руу (redirect гогцооноос сэргийлнэ).
  if (!ctx) redirect("/auth/signout");
  if (!ctx.gym) redirect(ctx.isPlatformAdmin ? "/admin" : "/no-access");
  if (options?.managerOnly && !ctx.gym.isManager) redirect("/dashboard");
  return ctx as WithGym;
}

export async function requireAdmin(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/auth/signout");
  if (!ctx.isPlatformAdmin) redirect("/dashboard");
  return ctx;
}
