"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WEEKDAY_LABELS, WEEKDAYS, type Weekday } from "../hours";
import type { HoursForm } from "../schemas";

type DayErrors = Partial<Record<Weekday, { open?: { message?: string }; close?: { message?: string } }>>;

/** Өдөр бүрийн нээх/хаах цаг. Хаах цаг 00:00 = шөнө дунд хүртэл. */
export function HoursEditor({
  value,
  onChange,
  disabled,
  errors,
}: {
  value: HoursForm;
  onChange: (value: HoursForm) => void;
  disabled?: boolean;
  errors?: DayErrors;
}) {
  const setDay = (day: Weekday, patch: Partial<HoursForm[Weekday]>) =>
    onChange({ ...value, [day]: { ...value[day], ...patch } });

  const copyToWeekdays = () => {
    const monday = value.mon;
    onChange({ ...value, tue: { ...monday }, wed: { ...monday }, thu: { ...monday }, fri: { ...monday } });
  };

  const setAllDay = () =>
    onChange(
      Object.fromEntries(WEEKDAYS.map((d) => [d, { closed: false, open: "00:00", close: "00:00" }])) as HoursForm,
    );

  return (
    <div className="space-y-3">
      <ul className="divide-y rounded-lg border">
        {WEEKDAYS.map((day) => {
          const d = value[day];
          const error = errors?.[day]?.close?.message ?? errors?.[day]?.open?.message;
          const label = WEEKDAY_LABELS[day];
          return (
            <li key={day} className="space-y-1 px-3 py-2.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="w-16 font-medium">{label}</span>
                <label className="flex min-h-9 items-center gap-2 text-sm">
                  <Switch
                    checked={!d.closed}
                    onCheckedChange={(open) => setDay(day, { closed: !open })}
                    disabled={disabled}
                    aria-label={`${label}: нээлттэй`}
                  />
                  <span className={cn("w-16", d.closed && "text-muted-foreground")}>{d.closed ? "Амарна" : "Нээлттэй"}</span>
                </label>
                {!d.closed && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      step={900}
                      value={d.open}
                      onChange={(e) => setDay(day, { open: e.target.value })}
                      disabled={disabled}
                      aria-label={`${label}: нээх цаг`}
                      aria-invalid={Boolean(error)}
                      className="w-28"
                    />
                    <span aria-hidden>–</span>
                    <Input
                      type="time"
                      step={900}
                      value={d.close}
                      onChange={(e) => setDay(day, { close: e.target.value })}
                      disabled={disabled}
                      aria-label={`${label}: хаах цаг`}
                      aria-invalid={Boolean(error)}
                      className="w-28"
                    />
                  </div>
                )}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={copyToWeekdays} disabled={disabled}>
          Даваагийн цагийг Мя–Ба-д хуулах
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={setAllDay} disabled={disabled}>
          24 цаг нээлттэй
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">Шөнө дунд хүртэл ажилладаг бол хаах цагийг 00:00 гэж оруулна.</p>
    </div>
  );
}
