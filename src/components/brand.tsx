import { DumbbellIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/config";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground",
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
      <span className="text-lg tracking-tight">{APP_NAME}</span>
    </Link>
  );
}
