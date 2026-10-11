import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { MembershipBadge } from "@/features/payments/components/membership-badge";
import { formatDate } from "@/lib/dates";
import { membershipStatus, type MembershipStatus } from "@/lib/membership";
import { formatPhone } from "@/lib/phone";
import { cn, initials } from "@/lib/utils";
import type { listClients } from "../queries";
import { ageFromBirthYear, GENDER_LABELS } from "../schemas";

type ClientRow = Awaited<ReturnType<typeof listClients>>["rows"][number];

const STATUS_DOT: Record<MembershipStatus, string> = {
  active: "bg-emerald-500",
  expiring: "bg-amber-400",
  expired: "bg-red-500",
  none: "bg-muted-foreground/40",
};

// Компьютер дээр багана, утсан дээр мөр бүр карт шиг (утас, багш нь нэрийн доор).
const GRID = "md:grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1.5fr)_1.25rem] md:gap-4";

/** Үйлчлүүлэгчдийн жагсаалт: avatar, төлөв, утас, багш, эрхийн хугацаа. */
export function ClientList({ rows, today, threshold }: { rows: ClientRow[]; today: string; threshold: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className={cn("hidden border-b bg-muted/50 px-4 py-2.5 text-xs font-medium text-muted-foreground", GRID)}>
        <span>Үйлчлүүлэгч</span>
        <span>Утас</span>
        <span>Багш</span>
        <span>Эрх</span>
        <span />
      </div>
      <ul className="divide-y">
        {rows.map((c) => {
          const { status } = membershipStatus(c.ends_on ?? null, today, threshold);
          const until = c.ends_on && `${formatDate(c.ends_on)} ${status === "expired" ? "дууссан" : "хүртэл"}`;
          const details = [c.gender && GENDER_LABELS[c.gender], c.birth_year && `${ageFromBirthYear(c.birth_year, today)} настай`]
            .filter(Boolean)
            .join(", ");
          return (
            <li key={c.id}>
              <Link
                href={`/clients/${c.id}`}
                className={cn(
                  "group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none",
                  GRID,
                )}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="relative shrink-0">
                    <span className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                      {initials(c.full_name)}
                    </span>
                    <span
                      className={cn("absolute right-0 bottom-0 size-3 rounded-full ring-2 ring-card", STATUS_DOT[status])}
                      aria-hidden
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{c.full_name}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 md:hidden">
                      <MembershipBadge endsOn={c.ends_on} today={today} threshold={threshold} />
                      {until && <span className="text-xs text-muted-foreground tabular-nums">{until}</span>}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-muted-foreground md:mt-0">
                      <span className="tabular-nums md:hidden">{formatPhone(c.phone)}</span>
                      <span className="md:hidden">{details && " · "}</span>
                      {details}
                      {c.trainer_name && <span className="md:hidden"> · Багш: {c.trainer_name}</span>}
                    </span>
                  </span>
                </div>
                <span className="hidden text-sm tabular-nums md:block">{formatPhone(c.phone)}</span>
                <span className="hidden truncate text-sm md:block">
                  {c.trainer_name ?? <span className="text-muted-foreground">—</span>}
                </span>
                <div className="hidden flex-col items-start gap-1 md:flex">
                  <MembershipBadge endsOn={c.ends_on} today={today} threshold={threshold} />
                  {until && <span className="text-xs text-muted-foreground tabular-nums">{until}</span>}
                </div>
                <ChevronRightIcon className="hidden size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 md:block" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
