import type { SubscriptionStatus } from "@/lib/auth/context";

export const SUBSCRIPTION_STATUS: Record<
  SubscriptionStatus,
  { label: string; variant: "info" | "success" | "danger" | "warning" }
> = {
  trial: { label: "Туршилт", variant: "info" },
  active: { label: "Идэвхтэй", variant: "success" },
  past_due: { label: "Төлбөр хоцорсон", variant: "danger" },
  suspended: { label: "Түр зогссон", variant: "danger" },
};

/** Үйлчлүүлэгчийн тоо тарифын хязгаарт хэр ойртсоныг (зөвхөн анхааруулга, хаахгүй). */
export function usageLevel(count: number, max: number | null) {
  if (!max) return "ok" as const;
  if (count > max) return "over" as const;
  if (count >= max * 0.9) return "near" as const;
  return "ok" as const;
}
