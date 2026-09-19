// Огнооны туслах функцууд.
//
// Бизнесийн огноонууд (төлсөн өдөр, дуусах огноо) нь цагийн бүсгүй "YYYY-MM-DD" мөр байна.
// `new Date("2026-09-19")` нь UTC шөнө дунд гэж уншигддаг тул ийм мөрийг Date болгохгүй,
// бүх тооцоог UTC дээр хийнэ. "Өнөөдөр"-ийг үргэлж Улаанбаатарын цагаар тодорхойлно.

export const APP_TIME_ZONE = "Asia/Ulaanbaatar";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const ubDateParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const ubTimeParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: APP_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((p) => p.type === type)?.value ?? "";
}

export function isISODate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return (
    date.getUTCFullYear() === Number(y) &&
    date.getUTCMonth() === Number(m) - 1 &&
    date.getUTCDate() === Number(d)
  );
}

/** Тухайн агшин Улаанбаатарын цагаар аль өдөр болохыг "YYYY-MM-DD"-ээр буцаана. */
export function toISODateUB(instant: Date): string {
  const parts = ubDateParts.formatToParts(instant);
  return `${part(parts, "year")}-${part(parts, "month")}-${part(parts, "day")}`;
}

/** Улаанбаатарын цагаар өнөөдрийн огноо, "YYYY-MM-DD". */
export function todayUB(now: Date = new Date()): string {
  return toISODateUB(now);
}

/** "2026-09-19" эсвэл timestamp → "2026.09.19". Хоосон утгад "—". */
export function formatDate(value: string | Date | null | undefined): string {
  if (value == null || value === "") return "—";
  if (typeof value === "string" && ISO_DATE.test(value)) {
    return value.replaceAll("-", ".");
  }
  const instant = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(instant.getTime())) return "—";
  return toISODateUB(instant).replaceAll("-", ".");
}

/** Timestamp → "2026.09.19 14:05" (Улаанбаатарын цагаар). */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (value == null || value === "") return "—";
  const instant = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(instant.getTime())) return "—";
  const time = ubTimeParts.formatToParts(instant);
  return `${formatDate(instant)} ${part(time, "hour")}:${part(time, "minute")}`;
}

function parseISODate(iso: string): { y: number; m: number; d: number } {
  if (!isISODate(iso)) throw new RangeError(`Буруу огноо: ${iso}`);
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

function fromUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysInMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

export function addDaysISO(iso: string, days: number): string {
  const { y, m, d } = parseISODate(iso);
  return fromUTC(new Date(Date.UTC(y, m - 1, d + days)));
}

/**
 * Сар нэмнэ. Postgres-ийн `date + interval 'N months'`-тэй адилхан
 * сарын сүүлийн өдрөөр тасална: 2027-01-31 + 1 сар = 2027-02-28.
 */
export function addMonthsISO(iso: string, months: number): string {
  const { y, m, d } = parseISODate(iso);
  const monthIndex = m - 1 + months;
  const year = y + Math.floor(monthIndex / 12);
  const month1 = (((monthIndex % 12) + 12) % 12) + 1;
  const day = Math.min(d, daysInMonth(year, month1));
  return fromUTC(new Date(Date.UTC(year, month1 - 1, day)));
}

/** b − a өдрөөр. diffDaysISO("2026-09-19", "2026-09-26") = 7 */
export function diffDaysISO(a: string, b: string): number {
  const pa = parseISODate(a);
  const pb = parseISODate(b);
  const ms = Date.UTC(pb.y, pb.m - 1, pb.d) - Date.UTC(pa.y, pa.m - 1, pa.d);
  return Math.round(ms / 86_400_000);
}

/** Тухайн сарын эхний ба сүүлийн өдөр: "2026-09-19" → ["2026-09-01", "2026-09-30"] */
export function monthRangeISO(iso: string): [string, string] {
  const { y, m } = parseISODate(iso);
  const mm = String(m).padStart(2, "0");
  return [`${y}-${mm}-01`, `${y}-${mm}-${String(daysInMonth(y, m)).padStart(2, "0")}`];
}
