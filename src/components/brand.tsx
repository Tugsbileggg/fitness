import { DumbbellIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/config";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        // Цайвар суурь дээр brand өнгө харагдахгүй тул бэх дэвсгэр дээр, бараан дээр эсрэгээр нь.
        "inline-flex size-9 items-center justify-center rounded-xl bg-ink text-brand dark:bg-brand dark:text-ink",
        className,
      )}
    >
      <DumbbellIcon className="size-5" />
    </span>
  );
}

export function Brand({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 font-semibold", className)}>
      <BrandMark />
      <span className="font-display text-sm whitespace-nowrap tracking-tight sm:text-base">{APP_NAME}</span>
    </Link>
  );
}
