"use client";

import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AMENITIES, type AmenityCode } from "../amenities";
import { AMENITY_ICONS } from "./amenity-icons";

export function AmenitiesPicker({
  value,
  onChange,
  disabled,
}: {
  value: AmenityCode[];
  onChange: (value: AmenityCode[]) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Үйлчилгээ">
      {AMENITIES.map(({ code, label }) => {
        const on = value.includes(code);
        const Icon = AMENITY_ICONS[code];
        return (
          <button
            key={code}
            type="button"
            aria-pressed={on}
            disabled={disabled}
            onClick={() => onChange(on ? value.filter((c) => c !== code) : [...value, code])}
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
              on ? "border-primary bg-accent text-accent-foreground" : "bg-background hover:bg-muted",
            )}
          >
            <Icon className="size-4" />
            {label}
            {on && <CheckIcon className="size-3.5" />}
          </button>
        );
      })}
    </div>
  );
}
