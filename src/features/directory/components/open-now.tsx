"use client";

import { cn } from "@/lib/utils";
import { useNowMinute } from "../browser";
import {
  describeOpenState,
  isAlwaysOpen,
  type OpeningHours,
  openState,
  summarizeHours,
  ubWeekdayTime,
  WEEKDAY_LABELS,
  WEEKDAYS,
} from "../hours";

/**
 * "Нээлттэй · 22:00 хүртэл". Хөтөч дээр Улаанбаатарын цагаар тооцно (кэшлэгдсэн HTML-д хуучирсан төлөв
 * үлдэхгүй). Hydration-ээс өмнө ижил өндөртэй хоосон зай үлдээнэ.
 */
export function OpenNowBadge({ hours, className }: { hours: OpeningHours; className?: string }) {
  const now = useNowMinute();
  if (!now) return <span className={cn("inline-block h-5", className)} aria-hidden />;
  const state = openState(hours, now);
  const { status, detail } = isAlwaysOpen(hours) ? { status: "Нээлттэй", detail: "24 цаг" } : describeOpenState(state);
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <span
        className={cn("size-2 shrink-0 rounded-full", state.open ? "bg-emerald-500" : "bg-muted-foreground/50")}
        aria-hidden
      />
      <span className={cn("font-medium", state.open ? "text-emerald-700" : "text-muted-foreground")}>{status}</span>
      {detail && <span className="text-muted-foreground">· {detail}</span>}
    </span>
  );
}

/** Долоо хоногийн хуваарь. Өнөөдрийн мөрийг (hydration-ы дараа) тодруулна. */
export function HoursTable({ hours }: { hours: OpeningHours }) {
  const now = useNowMinute();
  const today = now ? ubWeekdayTime(now).day : null;
  const grouped = summarizeHours(hours);
  // Бүх өдөр ижил бол ганц мөр хангалттай.
  if (grouped.length === 1) {
    return (
      <p className="text-sm">
        <span className="font-medium">{grouped[0].days}:</span> {grouped[0].hours}
      </p>
    );
  }
  return (
    <table className="w-full text-sm">
      <tbody>
        {WEEKDAYS.map((day) => {
          const value = hours[day];
          return (
            <tr key={day} className={cn("border-b last:border-0", day === today && "font-semibold")}>
              <th scope="row" className="py-1.5 pr-4 text-left font-[inherit]">
                {WEEKDAY_LABELS[day]}
                {day === today && <span className="ml-1.5 text-xs font-normal text-primary">өнөөдөр</span>}
              </th>
              <td className={cn("py-1.5 text-right tabular-nums", !value && "text-muted-foreground")}>
                {value ? `${value[0]}–${value[1]}` : "Амарна"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
