import { AlarmClockIcon, ArrowRightIcon, CalendarXIcon, PartyPopperIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertList } from "@/features/dashboard/components/alert-list";
import { getDashboard, RECENT_EXPIRED_DAYS } from "@/features/dashboard/queries";
import { requireGymContext } from "@/lib/auth/context";
import { formatDate } from "@/lib/dates";
import { formatMNT } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Хяналт" };

/** "attention" нь бараан карт (анхаарах зүйл байгаа үед), "danger" нь улаан тоо. */
function Stat({
  label,
  value,
  hint,
  href,
  tone,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  href?: string;
  tone?: "attention" | "danger";
  className?: string;
}) {
  const content = (
    <div
      className={cn(
        "flex h-full flex-col gap-1 rounded-2xl border bg-card p-4 text-card-foreground transition-colors",
        !href && className,
        href && "hover:border-foreground/25",
        tone === "attention" && "dark border-transparent bg-background text-foreground hover:border-brand/50",
      )}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "font-display text-2xl tabular-nums sm:text-3xl",
          tone === "attention" && "text-brand",
          tone === "danger" && "text-red-600",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-auto pt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
  return href ? (
    <Link
      href={href}
      className={cn("rounded-2xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none", className)}
    >
      {content}
    </Link>
  ) : (
    content
  );
}

export default async function DashboardPage() {
  const { fullName, gym, today } = await requireGymContext();
  const { summary, expiring, expired } = await getDashboard(gym.id, today);
  const firstName = fullName.trim().split(/\s+/).at(-1);

  return (
    <>
      <PageHeader title={`Сайн байна уу, ${firstName}`} description={`Өнөөдөр ${formatDate(today)}`} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Идэвхтэй үйлчлүүлэгч"
          value={summary.active_count}
          hint={summary.none_count > 0 ? `Эрхгүй: ${summary.none_count}` : undefined}
          href="/clients?status=active"
        />
        <Stat
          label={`${gym.expiringThresholdDays} хоногт дуусах`}
          value={summary.expiring_count}
          tone={summary.expiring_count > 0 ? "attention" : undefined}
          href="/clients?status=expiring"
        />
        <Stat
          label="Дууссан"
          value={summary.expired_count}
          hint={`Сүүлийн ${RECENT_EXPIRED_DAYS} хоногт: ${summary.expired_recent_count}`}
          tone={summary.expired_recent_count > 0 ? "danger" : undefined}
          href="/clients?status=expired"
        />
        {summary.month_revenue !== null ? (
          <Stat
            label="Энэ сарын орлого"
            value={formatMNT(summary.month_revenue)}
            hint={`Шинэ ${summary.month_new_clients} · Сунгасан ${summary.month_renewed_clients}`}
            href="/payments"
            className="col-span-2 lg:col-span-1"
          />
        ) : (
          <Stat
            label="Энэ сар"
            value={`${summary.month_new_clients + summary.month_renewed_clients}`}
            hint={`Шинэ ${summary.month_new_clients} · Сунгасан ${summary.month_renewed_clients}`}
            className="col-span-2 lg:col-span-1"
          />
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlarmClockIcon className="size-5 text-amber-600" />
              Хугацаа дуусах гэж буй
            </CardTitle>
            <CardDescription>
              Ойрын {gym.expiringThresholdDays} хоногт эрх нь дуусах үйлчлүүлэгчид, үлдсэн хоногоор эрэмбэлэв.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {expiring.length === 0 ? (
              <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground">
                <PartyPopperIcon className="size-5 shrink-0" />
                Ойрын {gym.expiringThresholdDays} хоногт эрх нь дуусах үйлчлүүлэгч алга.
              </div>
            ) : (
              <AlertList rows={expiring} kind="expiring" writable={gym.isWritable} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarXIcon className="size-5 text-red-600" />
              Хугацаа дууссан
            </CardTitle>
            <CardDescription>Сүүлийн {RECENT_EXPIRED_DAYS} хоногт эрх нь дууссан, сунгаагүй үйлчлүүлэгчид.</CardDescription>
          </CardHeader>
          <CardContent>
            {expired.length === 0 ? (
              <p className="rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground">
                Сүүлийн {RECENT_EXPIRED_DAYS} хоногт эрх нь дууссан үйлчлүүлэгч алга.
              </p>
            ) : (
              <AlertList rows={expired} kind="expired" writable={gym.isWritable} />
            )}
            {summary.expired_count > expired.length && (
              <Button asChild variant="link" className="mt-2 px-0">
                <Link href="/clients?status=expired">
                  Бүх дууссан үйлчлүүлэгч ({summary.expired_count})
                  <ArrowRightIcon />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
