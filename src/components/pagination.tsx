import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Энгийн өмнөх/дараах хуудаслалт. Одоогийн query параметрүүдийг хадгална. */
export function Pagination({
  page,
  pageSize,
  total,
  basePath,
  params,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  const href = (p: number) => {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) search.set(k, v);
    if (p > 1) search.set("page", String(p));
    const qs = search.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <nav className="mt-4 flex items-center justify-between gap-2" aria-label="Хуудаслалт">
      <Button asChild variant="outline" aria-disabled={page <= 1}>
        {page > 1 ? (
          <Link href={href(page - 1)}>
            <ChevronLeftIcon />
            Өмнөх
          </Link>
        ) : (
          <span className="pointer-events-none opacity-50">
            <ChevronLeftIcon />
            Өмнөх
          </span>
        )}
      </Button>
      <span className="text-sm text-muted-foreground">
        {page} / {pages} хуудас
      </span>
      <Button asChild variant="outline" aria-disabled={page >= pages}>
        {page < pages ? (
          <Link href={href(page + 1)}>
            Дараах
            <ChevronRightIcon />
          </Link>
        ) : (
          <span className="pointer-events-none opacity-50">
            Дараах
            <ChevronRightIcon />
          </span>
        )}
      </Button>
    </nav>
  );
}
