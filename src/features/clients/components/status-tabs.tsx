import Link from "next/link";
import type { MembershipStatus } from "@/lib/membership";
import { cn } from "@/lib/utils";

const TABS: { value: MembershipStatus | null; label: string }[] = [
  { value: null, label: "Бүгд" },
  { value: "active", label: "Идэвхтэй" },
  { value: "expiring", label: "Дуусах гэж буй" },
  { value: "expired", label: "Дууссан" },
  { value: "none", label: "Эрхгүй" },
];

export type StatusCounts = Record<MembershipStatus | "all", number>;

/** Эрхийн төлөвөөр шүүх tab-ууд. Хайлт ба багшийн шүүлтийг хадгалж, хуудаслалтыг эхлүүлнэ. */
export function StatusTabs({
  current,
  counts,
  params,
}: {
  current: MembershipStatus | undefined;
  counts: StatusCounts;
  params: Record<string, string | undefined>;
}) {
  const href = (status: MembershipStatus | null) => {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) search.set(k, v);
    if (status) search.set("status", status);
    const qs = search.toString();
    return qs ? `/clients?${qs}` : "/clients";
  };

  return (
    <nav aria-label="Эрхийн төлөвөөр шүүх" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:px-0">
      <ul className="flex w-max gap-1 rounded-full border bg-card p-1">
        {TABS.map((tab) => {
          const active = (current ?? null) === tab.value;
          const count = counts[tab.value ?? "all"];
          return (
            <li key={tab.label}>
              <Link
                href={href(tab.value)}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  active && "bg-ink text-white hover:bg-ink hover:text-white",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "min-w-6 rounded-full px-1.5 text-center text-xs tabular-nums",
                    active ? "bg-brand text-ink" : "bg-muted text-muted-foreground",
                    !active && tab.value === "expiring" && count > 0 && "bg-amber-100 text-amber-900",
                  )}
                >
                  {count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
