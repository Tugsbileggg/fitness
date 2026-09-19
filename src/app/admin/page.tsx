import { AlertTriangleIcon, ClockIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GymList } from "@/features/admin/components/gym-list";
import { getGymOverview, getPlatformSummary } from "@/features/admin/queries";
import { PLATFORM_WARNING_DAYS } from "@/lib/config";
import { formatMNT } from "@/lib/money";

export const metadata: Metadata = { title: "Админ самбар" };

function Stat({ label, value, href }: { label: string; value: React.ReactNode; href?: string }) {
  const card = (
    <Card className="h-full gap-1 py-4">
      <CardHeader className="px-4">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

export default async function AdminHomePage() {
  const [summary, gyms] = await Promise.all([getPlatformSummary(), getGymOverview()]);
  const pastDue = gyms.filter((g) => g.status === "past_due");
  const expiringSoon = gyms
    .filter((g) => (g.status === "trial" || g.status === "active") && g.days_left <= PLATFORM_WARNING_DAYS)
    .sort((a, b) => a.days_left - b.days_left);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Платформын тойм</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Энэ сарын орлого" value={formatMNT(summary.month_revenue)} href="/admin/payments" />
        <Stat label="Сарын тогтмол орлого (MRR)" value={formatMNT(summary.mrr)} />
        <Stat label="Нийт фитнес" value={summary.gym_count} href="/admin/gyms" />
        <Stat
          label="Идэвхтэй · Туршилт"
          value={`${summary.active_count} · ${summary.trial_count}`}
          href="/admin/gyms?status=active"
        />
        <Stat label="Төлбөр хоцорсон" value={summary.past_due_count} href="/admin/gyms?status=past_due" />
        <Stat label="Түр зогссон" value={summary.suspended_count} href="/admin/gyms?status=suspended" />
        <Stat label={`${PLATFORM_WARNING_DAYS} хоногт дуусах`} value={summary.expiring_soon_count} />
        <Stat label="Энэ сарын төлбөр" value={summary.month_payment_count} href="/admin/payments" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Card className="gap-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="size-5 text-red-600" />
              Төлбөр хоцорсон фитнесүүд
            </CardTitle>
            <CardDescription>Эрх дууссан тул зөвхөн харах горимд байгаа.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {pastDue.length === 0 ? (
              <p className="px-6 text-sm text-muted-foreground">Төлбөр хоцорсон фитнес алга.</p>
            ) : (
              <GymList rows={pastDue} />
            )}
          </CardContent>
        </Card>
        <Card className="gap-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClockIcon className="size-5 text-amber-600" />
              Удахгүй эрх дуусах
            </CardTitle>
            <CardDescription>{PLATFORM_WARNING_DAYS} хоногийн дотор туршилт эсвэл төлсөн эрх нь дуусах.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {expiringSoon.length === 0 ? (
              <p className="px-6 text-sm text-muted-foreground">Ойрын хугацаанд эрх дуусах фитнес алга.</p>
            ) : (
              <GymList rows={expiringSoon} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
