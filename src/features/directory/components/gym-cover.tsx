import { DumbbellIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Нүүр зураг, байхгүй бол үндсэн өнгөтэй дэвсгэр. */
export function GymCover({
  src,
  alt,
  className,
  priority,
}: {
  src: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "flex size-full items-center justify-center bg-linear-to-br from-primary/70 to-primary text-primary-foreground",
          className,
        )}
        aria-hidden
      >
        <DumbbellIcon className="size-10 opacity-70" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- хөтөч дээр 1600px болгож багасгасан, Supabase Storage-оос шууд
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn("size-full object-cover", className)}
    />
  );
}
