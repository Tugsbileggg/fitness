import { PhoneIcon, WalletIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";
import { formatPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import type { AlertRow } from "../queries";
import { NoticeControls } from "./notice-controls";

function urgency(row: AlertRow, kind: "expiring" | "expired") {
  if (kind === "expired") return { bar: "bg-red-500", badge: "danger" as const, label: `${-row.days_left} хоногийн өмнө дууссан` };
  if (row.days_left === 0) return { bar: "bg-red-500", badge: "danger" as const, label: "Өнөөдөр дуусна" };
  if (row.days_left <= 2) return { bar: "bg-red-500", badge: "danger" as const, label: `${row.days_left} хоног үлдсэн` };
  return { bar: "bg-amber-400", badge: "warning" as const, label: `${row.days_left} хоног үлдсэн` };
}

/** Дуусах гэж буй / дууссан үйлчлүүлэгчдийн жагсаалт: утасдах, мэдэгдсэн тэмдэглэх, сунгах. */
export function AlertList({
  rows,
  kind,
  writable,
}: {
  rows: AlertRow[];
  kind: "expiring" | "expired";
  writable: boolean;
}) {
  return (
    <ul className="divide-y">
      {rows.map((row) => {
        const u = urgency(row, kind);
        return (
          <li key={row.id} className="relative flex gap-3 py-3 pr-1 pl-4">
            <span className={cn("absolute top-3 bottom-3 left-0 w-1 rounded-full", u.bar)} aria-hidden />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Link href={`/clients/${row.id}`} className="font-medium hover:underline">
                  {row.full_name}
                </Link>
                <Badge variant={u.badge}>{u.label}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <a href={`tel:${row.phone}`} className="inline-flex items-center gap-1 text-primary">
                  <PhoneIcon className="size-3.5" />
                  {formatPhone(row.phone)}
                </a>
                <span>
                  {formatDate(row.ends_on)} {kind === "expiring" ? "хүртэл" : "дууссан"}
                  {row.last_plan_name && ` · ${row.last_plan_name}`}
                </span>
                {row.trainer_name && <span>Багш: {row.trainer_name}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <NoticeControls
                  clientId={row.id}
                  clientName={row.full_name}
                  endsOn={row.ends_on}
                  disabled={!writable}
                  notice={
                    row.notice_id && row.notified_at
                      ? { id: row.notice_id, notifiedAt: row.notified_at, note: row.notice_note, by: row.notified_by_name }
                      : null
                  }
                />
                {writable && (
                  <Button asChild size="sm">
                    <Link href={`/clients/${row.id}/pay?from=dashboard`}>
                      <WalletIcon />
                      {kind === "expiring" ? "Сунгах" : "Төлбөр бүртгэх"}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
