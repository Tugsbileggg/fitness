"use client";

import type { ReactNode } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

/** Товч хэлбэртэй сонголт (radio). Хүрэхэд том, технологид тааруу хэрэглэгчид ойлгомжтой. */
export function ChoiceGroup<T extends string>({
  value,
  onChange,
  options,
  columns = 2,
  invalid,
  className,
  "aria-label": ariaLabel,
}: {
  value: T | undefined;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: ReactNode; description?: ReactNode; disabled?: boolean; ariaLabel?: string }>;
  columns?: 2 | 3 | 4;
  invalid?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <RadioGroup
      value={value ?? ""}
      onValueChange={(v) => onChange(v as T)}
      aria-label={ariaLabel}
      aria-invalid={invalid}
      className={cn(
        "grid gap-2",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-3",
        columns === 4 && "grid-cols-2 sm:grid-cols-4",
        className,
      )}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "flex min-h-10 cursor-pointer items-start gap-2.5 rounded-lg border bg-background px-3 py-2.5 text-base transition-colors",
            value === option.value && "border-primary bg-accent",
            invalid && "border-destructive",
            option.disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <RadioGroupItem
            value={option.value}
            disabled={option.disabled}
            className="mt-1"
            aria-label={option.ariaLabel ?? (typeof option.label === "string" ? option.label : undefined)}
          />
          <span className="min-w-0">
            <span className="block leading-snug">{option.label}</span>
            {option.description && (
              <span className="block text-sm text-muted-foreground">{option.description}</span>
            )}
          </span>
        </label>
      ))}
    </RadioGroup>
  );
}
