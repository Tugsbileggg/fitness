// Эрхийн хугацаа, хөнгөлөлт, төлөвийн тооцоо.
// Жинхэнэ тооцоог DB (app.compute_period, app.compute_discount) хийдэг; энэ нь маягт дээрх
// урьдчилсан харагдацад зориулсан ИЖИЛ логик. Нийцлийг tests/fixtures/membership-cases.ts шалгана.
import { addDaysISO, addMonthsISO, diffDaysISO } from "@/lib/dates";

export type DiscountType = "none" | "amount" | "percent";

/**
 * Одоогийн эрх төлсөн өдөр хүчинтэй бол дуусах огнооноос үргэлжлүүлнэ, үгүй бол төлсөн өдрөөс.
 * ends_on нь хүчинтэй сүүлийн өдөр: 2026-09-19 + 1 сар → 2026-10-19.
 */
export function computePeriod(currentEnd: string | null, paidOn: string, months: number) {
  const extending = currentEnd !== null && currentEnd >= paidOn;
  const base = extending ? currentEnd : paidOn;
  return {
    startsOn: extending ? addDaysISO(currentEnd, 1) : paidOn,
    endsOn: addMonthsISO(base, months),
    extending,
  };
}

export class DiscountError extends Error {}

/** Хөнгөлөлтийн дүн (₮). Буруу утгад DiscountError шидэнэ. */
export function computeDiscount(price: number, type: DiscountType, value: number): number {
  if (type === "none") return 0;
  if (!Number.isInteger(value) || value < 0) throw new DiscountError("Хөнгөлөлтийн утга буруу байна");
  if (type === "amount") {
    if (value > price) throw new DiscountError("Хөнгөлөлт багцын үнээс их байж болохгүй");
    return value;
  }
  if (value > 100) throw new DiscountError("Хөнгөлөлтийн хувь 100-аас их байж болохгүй");
  // Postgres round(): 0.5-ыг дээш бүхэлтгэнэ. Бутархай алдаанаас сэргийлж бүхэл тоогоор бодно.
  return Math.floor((price * value + 50) / 100);
}

export type MembershipStatus = "active" | "expiring" | "expired" | "none";

/** Үйлчлүүлэгчийн эрхийн төлөв. threshold = "дуусах гэж буй" хоног (фитнесийн тохиргоо). */
export function membershipStatus(endsOn: string | null, today: string, threshold: number) {
  if (!endsOn) return { status: "none" as const, daysLeft: null };
  const daysLeft = diffDaysISO(today, endsOn);
  if (daysLeft < 0) return { status: "expired" as const, daysLeft };
  if (daysLeft <= threshold) return { status: "expiring" as const, daysLeft };
  return { status: "active" as const, daysLeft };
}

export const PAYMENT_METHOD_LABELS = {
  cash: "Бэлэн",
  bank_transfer: "Дансаар",
  qpay: "QPay",
} as const;

export function durationLabel(months: number) {
  if (months % 12 === 0) return months === 12 ? "1 жил" : `${months / 12} жил`;
  return `${months} сар`;
}
