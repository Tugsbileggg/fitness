import { BadgeCheckIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SUBSCRIPTION_STATUS, usageLevel } from "@/features/billing/status";
import { formatDate } from "@/lib/dates";
import { formatPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import type { GymOverviewRow } from "../queries";

export function accessText(row: Pick<GymOverviewRow, "status" | "access_ends_on" | "days_left">) {
  if (row.status === "suspended") return "Түр зогссон";
  if (row.status === "past_due") return `${formatDate(row.access_ends_on)}-нд дууссан (${-row.days_left} хоног)`;
  if (row.days_left === 0) return "Өнөөдөр дуусна";
  return `${formatDate(row.access_ends_on)} хүртэл (${row.days_left} хоног)`;
}

export function GymList({
  rows,
  profiles,
}: {
  rows: GymOverviewRow[];
  /** Танилцуулга нийтэлсэн ч баталгаажаагүй фитнесийг тэмдэглэхэд. */
  profiles?: Map<string, { isPublished: boolean }>;
}) {
  return (
    <ul className="divide-y">
      {rows.map((g) => {
        const status = SUBSCRIPTION_STATUS[g.status];
        const level = usageLevel(g.client_count, g.plan_max_clients);
        return (
          <li key={g.gym_id}>
            <Link href={`/admin/gyms/${g.gym_id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{g.name}</span>
                  <Badge variant={status.variant}>{status.label}</Badge>
                  {g.verified_at ? (
                    <BadgeCheckIcon className="size-4 text-primary" aria-label="Баталгаажсан" />
                  ) : profiles?.get(g.gym_id)?.isPublished ? (
                    <Badge variant="warning">Танилцуулга баталгаажуулалт хүлээж байна</Badge>
                  ) : (
                    <Badge variant="outline">Баталгаажаагүй</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                  <span className={cn(g.status !== "active" && g.status !== "trial" && "text-destructive", g.days_left <= 5 && g.days_left >= 0 && "text-amber-700")}>
                    {accessText(g)}
                  </span>
                  <span className={cn(level === "over" && "text-destructive", level === "near" && "text-amber-700")}>
                    {g.client_count}
                    {g.plan_max_clients ? `/${g.plan_max_clients}` : ""} үйлчлүүлэгч
                  </span>
                  <span>{g.plan_name ?? "Тарифгүй"}</span>
                  <span>
                    {g.manager_name} · {formatPhone(g.phone)}
                  </span>
                </div>
              </div>
              <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
