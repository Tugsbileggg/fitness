import { CheckIcon, WalletIcon } from "lucide-react";
import { addDaysISO, addMonthsISO, formatDate, todayUB } from "@/lib/dates";
import { formatMNT } from "@/lib/money";
import { cn } from "@/lib/utils";

// Зохиомол фитнесийн өгөгдөл. Огноог өнөөдрөөс тооцдог тул загвар хэзээ ч хуучрахгүй.
const EXPIRING = [
  { name: "Б. Сараа", plan: "1 сар", days: 0 },
  { name: "Г. Тэмүүлэн", plan: "3 сар", days: 2 },
  { name: "Н. Ану", plan: "1 сар", days: 4 },
  { name: "Д. Батболд", plan: "6 сар", days: 6 },
];

const REVENUE = [7.2, 8.1, 7.6, 9.4, 10.8, 12.45];

function daysLabel(days: number) {
  return days === 0 ? "Өнөөдөр дуусна" : `${days} хоног үлдсэн`;
}

/** Нүүр хуудасны hero доорх менежерийн самбарын загвар. Зөвхөн чимэглэл тул screen reader-т нуугдана. */
export function HeroPreview() {
  const today = todayUB();
  const month = Number(today.slice(5, 7));
  const months = REVENUE.map((_, i) => ((month - REVENUE.length + i + 12) % 12) + 1);

  return (
    <div aria-hidden className="light relative mx-auto max-w-5xl select-none">
      <div className="absolute inset-x-10 -top-6 h-40 rounded-full bg-brand/25 blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border bg-background text-foreground shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between gap-3 border-b bg-card px-4 py-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-ink font-display text-xs text-brand">Х</span>
              <span className="text-sm font-semibold">Хүч фитнес</span>
            </div>
            <div className="hidden items-center gap-1 text-sm sm:flex">
              <span className="rounded-full bg-accent px-3 py-1 font-medium text-accent-foreground">Самбар</span>
              <span className="px-3 py-1 text-muted-foreground">Үйлчлүүлэгчид</span>
              <span className="px-3 py-1 text-muted-foreground">Төлбөр</span>
              <span className="px-3 py-1 text-muted-foreground">Багц</span>
            </div>
          </div>
          <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">БС</span>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">Идэвхтэй үйлчлүүлэгч</p>
              <p className="mt-1 font-display text-2xl">148</p>
              <p className="mt-1 text-xs text-emerald-700">+12 энэ сард</p>
            </div>
            <div className="rounded-xl bg-ink p-4 text-white">
              <p className="text-xs text-white/70">7 хоногт дуусах</p>
              <p className="mt-1 font-display text-2xl text-brand">9</p>
              <p className="mt-1 text-xs text-white/70">Өнөөдөр 1</p>
            </div>
            <div className="col-span-2 rounded-xl border bg-card p-4 sm:col-span-1">
              <p className="text-xs text-muted-foreground">Энэ сарын орлого</p>
              <p className="mt-1 font-display text-2xl">{formatMNT(12_450_000)}</p>
              <p className="mt-1 text-xs text-muted-foreground">86 төлбөр</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-xl border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">Эрх нь дуусах гэж буй</p>
                <span className="text-xs text-muted-foreground">7 хоногийн дотор</span>
              </div>
              <ul className="divide-y">
                {EXPIRING.map((row, i) => (
                  <li key={row.name} className={cn("relative flex items-center gap-3 py-2.5 pl-3.5", i > 2 && "hidden sm:flex")}>
                    <span
                      className={cn(
                        "absolute top-2.5 bottom-2.5 left-0 w-1 rounded-full",
                        row.days <= 2 ? "bg-red-500" : "bg-amber-400",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-medium">{row.name}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-medium",
                            row.days <= 2 ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900",
                          )}
                        >
                          {daysLabel(row.days)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(addDaysISO(today, row.days))} хүртэл · {row.plan}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-white">
                      <WalletIcon className="size-3.5" />
                      Сунгах
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden rounded-xl border bg-card p-4 lg:flex lg:flex-col">
              <p className="text-sm font-semibold">Сарын орлого</p>
              <p className="text-xs text-muted-foreground">сая ₮</p>
              <div className="mt-4 flex flex-1 items-end gap-2">
                {REVENUE.map((value, i) => {
                  const current = i === REVENUE.length - 1;
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                      <span className={cn("text-[11px]", current ? "font-semibold" : "text-muted-foreground")}>
                        {value.toFixed(1)}
                      </span>
                      <div
                        className={cn("w-full rounded-md", current ? "bg-ink" : "bg-muted-foreground/20")}
                        style={{ height: `${(value / 12.45) * 110}px` }}
                      />
                      <span className="text-[11px] text-muted-foreground">{months[i]} сар</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -top-8 right-14 hidden w-64 rounded-xl border bg-card p-3 text-foreground shadow-xl lg:block">
        <div className="flex items-start gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-ink">
            <CheckIcon className="size-4" />
          </span>
          <div className="min-w-0 text-xs">
            <p className="text-sm font-semibold">Төлбөр бүртгэгдлээ</p>
            <p className="mt-0.5 text-muted-foreground">Б. Сараа · 3 сар · {formatMNT(240_000)}</p>
            <p className="mt-1 font-medium">
              {formatDate(today)} → {formatDate(addMonthsISO(today, 3))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
