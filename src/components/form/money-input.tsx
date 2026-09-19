"use client";

import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { formatMNTInput } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Мөнгөн дүнгийн талбар: бичих явцад "1,250,000" хэлбэрээр харуулж, ₮ тэмдэгтэй.
 * value/onChange нь зөвхөн цифрүүдийг (таслалгүй) дамжуулна.
 */
export function MoneyInput({
  value,
  onChange,
  className,
  ...props
}: Omit<ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value: string | undefined;
  onChange: (digits: string) => void;
}) {
  return (
    <div className="relative">
      <Input
        {...props}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={formatMNTInput(value ?? "")}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        className={cn("pr-8 tabular-nums", className)}
      />
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground">₮</span>
    </div>
  );
}
