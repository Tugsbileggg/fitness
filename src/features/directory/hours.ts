// Цагийн хуваарь. DB (gym_profiles.opening_hours): { mon: ["07:00", "22:00"] | null, ... }, 7 өдөр бүгд.
// null = тухайн өдөр амарна. "Одоо нээлттэй эсэх"-ийг Улаанбаатарын цагаар тооцно.
// DB-ийн шалгалт: app.valid_opening_hours().
import { APP_TIME_ZONE } from "@/lib/dates";

export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];
export type DayHours = [open: string, close: string] | null;
export type OpeningHours = Record<Weekday, DayHours>;

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: "Даваа",
  tue: "Мягмар",
  wed: "Лхагва",
  thu: "Пүрэв",
  fri: "Баасан",
  sat: "Бямба",
  sun: "Ням",
};

const WEEKDAY_SHORT: Record<Weekday, string> = {
  mon: "Да",
  tue: "Мя",
  wed: "Лх",
  thu: "Пү",
  fri: "Ба",
  sat: "Бя",
  sun: "Ня",
};

export const OPEN_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
/** Хаах цаг "24:00" байж болно (шөнө дунд хүртэл). */
export const CLOSE_TIME = /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/;

/** Шинэ танилцуулгын анхдагч хуваарь. Менежер хадгалахаасаа өмнө маягт дээр харж засна. */
export const DEFAULT_OPENING_HOURS: OpeningHours = {
  mon: ["07:00", "22:00"],
  tue: ["07:00", "22:00"],
  wed: ["07:00", "22:00"],
  thu: ["07:00", "22:00"],
  fri: ["07:00", "22:00"],
  sat: ["09:00", "20:00"],
  sun: ["09:00", "20:00"],
};

export function isValidDayHours(value: unknown): value is DayHours {
  if (value === null) return true;
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "string" &&
    typeof value[1] === "string" &&
    OPEN_TIME.test(value[0]) &&
    CLOSE_TIME.test(value[1]) &&
    value[0] < value[1]
  );
}

/** DB-ээс ирсэн утгыг шалгана. Хоосон эсвэл буруу бол null (хуваарь оруулаагүй гэж үзнэ). */
export function parseOpeningHours(value: unknown): OpeningHours | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const result = {} as Record<Weekday, DayHours>;
  for (const day of WEEKDAYS) {
    const dayHours = source[day];
    if (dayHours === undefined || !isValidDayHours(dayHours)) return null;
    result[day] = dayHours;
  }
  return result;
}

/** 7 хоног бүгд 00:00–24:00. */
export function isAlwaysOpen(hours: OpeningHours): boolean {
  return WEEKDAYS.every((d) => hours[d]?.[0] === "00:00" && hours[d]?.[1] === "24:00");
}

const ubParts = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIME_ZONE,
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const WEEKDAY_FROM_EN: Record<string, Weekday> = {
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
  Sun: "sun",
};

/** Тухайн агшин Улаанбаатарын цагаар аль гараг, хэдэн цаг болохыг ("HH:MM") буцаана. */
export function ubWeekdayTime(now: Date): { day: Weekday; time: string } {
  const parts = ubParts.formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return { day: WEEKDAY_FROM_EN[get("weekday")], time: `${get("hour")}:${get("minute")}` };
}

export type OpenState =
  | { open: true; closesAt: string }
  | { open: false; opensAt: string; opensOn: "today" | "tomorrow" | Weekday }
  | { open: false; opensAt: null; opensOn: null };

export function openState(hours: OpeningHours, now: Date = new Date()): OpenState {
  const { day, time } = ubWeekdayTime(now);
  const today = hours[day];
  if (today && today[0] <= time && time < today[1]) return { open: true, closesAt: today[1] };
  if (today && time < today[0]) return { open: false, opensAt: today[0], opensOn: "today" };

  const index = WEEKDAYS.indexOf(day);
  for (let offset = 1; offset <= 7; offset++) {
    const next = WEEKDAYS[(index + offset) % 7];
    const nextHours = hours[next];
    if (nextHours) return { open: false, opensAt: nextHours[0], opensOn: offset === 1 ? "tomorrow" : next };
  }
  return { open: false, opensAt: null, opensOn: null };
}

/** Тэмдэглэгээ: { status: "Нээлттэй", detail: "22:00 хүртэл" }. */
export function describeOpenState(state: OpenState): { status: string; detail: string | null } {
  if (state.open) return { status: "Нээлттэй", detail: `${state.closesAt} хүртэл` };
  if (!state.opensAt) return { status: "Хаалттай", detail: null };
  if (state.opensOn === "today") return { status: "Хаалттай", detail: `${state.opensAt} цагт нээнэ` };
  if (state.opensOn === "tomorrow") return { status: "Хаалттай", detail: `Маргааш ${state.opensAt} цагт нээнэ` };
  return { status: "Хаалттай", detail: `${WEEKDAY_LABELS[state.opensOn]} ${state.opensAt} цагт нээнэ` };
}

const formatDayHours = (value: DayHours) => (value ? `${value[0]}–${value[1]}` : "Амарна");
const sameHours = (a: DayHours, b: DayHours) => (a === null ? b === null : b !== null && a[0] === b[0] && a[1] === b[1]);

/**
 * Ижил цагтай дараалсан өдрүүдийг бүлэглэнэ:
 * [{ days: "Да–Ба", hours: "07:00–22:00" }, { days: "Бямба", hours: "09:00–20:00" }, { days: "Ням", hours: "Амарна" }]
 */
export function summarizeHours(hours: OpeningHours): Array<{ days: string; hours: string }> {
  if (isAlwaysOpen(hours)) return [{ days: "Өдөр бүр", hours: "24 цаг" }];

  const groups: Array<{ from: Weekday; to: Weekday; value: DayHours }> = [];
  for (const day of WEEKDAYS) {
    const last = groups.at(-1);
    if (last && sameHours(last.value, hours[day])) last.to = day;
    else groups.push({ from: day, to: day, value: hours[day] });
  }
  if (groups.length === 1) return [{ days: "Өдөр бүр", hours: formatDayHours(groups[0].value) }];

  return groups.map((g) => ({
    days: g.from === g.to ? WEEKDAY_LABELS[g.from] : `${WEEKDAY_SHORT[g.from]}–${WEEKDAY_SHORT[g.to]}`,
    hours: formatDayHours(g.value),
  }));
}
