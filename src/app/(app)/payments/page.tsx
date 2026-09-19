import { ChevronLeftIcon, ChevronRightIcon, WalletIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listMonthPayments } from "@/features/payments/queries";
import { requireGymContext } from "@/lib/auth/context";
import { addMonthsISO, formatDate } from "@/lib/dates";
import { PAYMENT_METHOD_LABELS } from "@/lib/membership";
import { formatMNT } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Төлбөрүүд" };

const MONTHS = [
  "1-р сар", "2-р сар", "3-р сар", "4-р сар", "5-р сар", "6-р сар",
  "7-р сар", "8-р сар", "9-р сар", "10-р сар", "11-р сар", "12-р сар",
];

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return `${y} оны ${MONTHS[m - 1]}`;
}

export default async function PaymentsPage({ searchParams }: PageProps<"/payments">) {
  const { gym, today } = await requireGymContext({ managerOnly: true });
  const { month: monthParam } = await searchParams;
  const currentMonth = today.slice(0, 7);
  const month =
    typeof monthParam === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam) && monthParam <= currentMonth
      ? monthParam
      : currentMonth;

  const { rows, totals } = await listMonthPayments(gym.id, month);
  const prev = addMonthsISO(`${month}-01`, -1).slice(0, 7);
  const next = addMonthsISO(`${month}-01`, 1).slice(0, 7);

  return (
    <>
      <PageHeader
        title="Төлбөрүүд"
        description="Үйлчлүүлэгчдийн эрхийн төлбөр, сарын орлого"
        actions={
          <div className="flex items-center gap-1">
            <Button asChild variant="outline" size="icon" aria-label="Өмнөх сар">
              <Link href={`/payments?month=${prev}`}>
                <ChevronLeftIcon />
              </Link>
            </Button>
            <span className="min-w-36 text-center font-medium">{monthLabel(month)}</span>
            {next <= currentMonth ? (
              <Button asChild variant="outline" size="icon" aria-label="Дараах сар">
                <Link href={`/payments?month=${next}`}>
                  <ChevronRightIcon />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="icon" disabled aria-label="Дараах сар">
                <ChevronRightIcon />
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="col-span-2 lg:col-span-1">
          <CardHeader>
            <CardDescription>Нийт орлого</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{formatMNT(totals.amount)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Бэлэн</CardDescription>
            <CardTitle className="tabular-nums">{formatMNT(totals.cash)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Дансаар</CardDescription>
            <CardTitle className="tabular-nums">{formatMNT(totals.bank)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <CardHeader>
            <CardDescription>Төлбөрийн тоо</CardDescription>
            <CardTitle>
              {totals.count}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                (шинэ {totals.newCount}, сунгалт {totals.renewalCount})
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={WalletIcon} title="Энэ сард төлбөр бүртгэгдээгүй байна" />
      ) : (
        <Card className="p-0">
          <CardContent className="divide-y p-0">
            {rows.map((p) => (
              <div key={p.id} className={cn("flex items-start gap-3 px-4 py-3", p.voided_at && "opacity-60")}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {p.client ? (
                      <Link href={`/clients/${p.client.id}`} className="font-medium hover:underline">
                        {p.client.full_name}
                      </Link>
                    ) : (
                      <span className="font-medium">—</span>
                    )}
                    <Badge variant={p.is_renewal ? "info" : "outline"}>{p.is_renewal ? "Сунгалт" : "Шинэ"}</Badge>
                    {p.voided_at && <Badge variant="danger">Хүчингүй</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(p.paid_on)} · {p.plan_name} · {PAYMENT_METHOD_LABELS[p.method]}
                    {p.recorder && ` · ${p.recorder.full_name}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn("font-semibold tabular-nums", p.voided_at && "line-through")}>
                    {formatMNT(p.amount)}
                  </div>
                  {p.discount_amount > 0 && (
                    <div className="text-xs text-emerald-700">−{formatMNT(p.discount_amount)}</div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
