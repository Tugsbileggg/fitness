import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * 404 ба алдааны хуудасны агуулга. `code` нь том тоо (404) эсвэл icon.
 * Hook ашигладаггүй тул сервер (not-found) болон client (error) хоёуланд нь хэрэглэгдэнэ.
 */
export function StatusScreen({
  code,
  icon: Icon,
  title,
  description,
  actions,
  footnote,
  className,
}: {
  code?: string;
  icon?: LucideIcon;
  title: string;
  description: ReactNode;
  actions: ReactNode;
  footnote?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-4 py-16 text-center", className)}>
      {code ? (
        <p className="font-display text-7xl leading-none text-ink sm:text-8xl dark:text-brand">{code}</p>
      ) : (
        Icon && (
          <span className="flex size-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Icon className="size-7" />
          </span>
        )
      )}
      <h1 className="mt-6 font-display text-2xl sm:text-3xl">{title}</h1>
      <p className="mt-3 max-w-md text-muted-foreground">{description}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">{actions}</div>
      {footnote && <p className="mt-8 text-xs text-muted-foreground">{footnote}</p>}
    </div>
  );
}
