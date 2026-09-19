import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listMonthPlatformPayments } from "@/features/admin/queries";
import { requireAdmin } from "@/lib/auth/context";
import { addMonthsISO, formatDate } from "@/lib/dates";
import { PAYMENT_METHOD_LABELS } from "@/lib/membership";
import { formatMNT } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Платформын төлбөрүүд" };

export default async function AdminPaymentsPage({ searchParams }: PageProps<"/admin/payments">) {
  const { today } = await requireAdmin();
  const { month: monthParam } = await searchParams;
  const currentMonth = today.slice(0, 7);
  const month =
    typeof monthParam === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam) && monthParam <= currentMonth
      ? monthParam
      : currentMonth;
  const rows = await listMonthPlatformPayments(month);
  const valid = rows.filter((r) => !r.voided_at);
  const total = valid.reduce((sum, r) => sum + Number(r.amount), 0);
  const prev = addMonthsISO(`${month}-01`, -1).slice(0, 7);
  const next = addMonthsISO(`${month}-01`, 1).slice(0, 7);
  const [y, m] = month.split("-").map(Number);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Платформын төлбөрүүд</h1>
        <div className="flex items-center gap-1">
          <Button asChild variant="outline" size="icon" aria-label="Өмнөх сар">
            <Link href={`/admin/payments?month=${prev}`}>
              <ChevronLeftIcon />
            </Link>
          </Button>
          <span className="min-w-32 text-center font-medium">
            {y} оны {m}-р сар
          </span>
          {next <= currentMonth ? (
            <Button asChild variant="outline" size="icon" aria-label="Дараах сар">
              <Link href={`/admin/payments?month=${next}`}>
                <ChevronRightIcon />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="icon" disabled aria-label="Дараах сар">
              <ChevronRightIcon />
            </Button>
          )}
        </div>
      </div>

      <Card className="max-w-sm">
        <CardHeader>
          <CardDescription>Нийт орлого ({valid.length} төлбөр)</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{formatMNT(total)}</CardTitle>
        </CardHeader>
      </Card>

      <Card className="divide-y p-0">
        {rows.length === 0 && <p className="p-4 text-sm text-muted-foreground">Энэ сард төлбөр бүртгэгдээгүй.</p>}
        {rows.map((p) => (
          <div key={p.id} className={cn("flex items-start gap-3 px-4 py-3", p.voided_at && "opacity-60")}>
            <div className="min-w-0 flex-1 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/gyms/${p.gym_id}`} className="font-medium hover:underline">
                  {p.gym?.name ?? "—"}
                </Link>
                {p.voided_at && <Badge variant="danger">Хүчингүй</Badge>}
              </div>
              <div className="text-muted-foreground">
                {formatDate(p.paid_on)} · {p.plan_name} · {p.months} сар · {PAYMENT_METHOD_LABELS[p.method]}
              </div>
            </div>
            <div className={cn("font-semibold tabular-nums", p.voided_at && "line-through")}>{formatMNT(p.amount)}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}
