import { cn } from "@/lib/utils";

/** Фитнесийн лого, байхгүй бол нэрийн эхний үсэг. */
export function GymLogo({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary text-sm font-semibold text-primary-foreground",
        className,
      )}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- жижиг лого, Supabase Storage-оос шууд
        <img src={logoUrl} alt="" className="size-full bg-white object-contain" />
      ) : (
        name.trim().charAt(0).toUpperCase()
      )}
    </span>
  );
}
