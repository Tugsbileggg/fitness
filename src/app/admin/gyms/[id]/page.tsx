import { ArrowLeftIcon, ExternalLinkIcon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GymAdminActions, VoidPlatformPaymentButton } from "@/features/admin/components/gym-admin-actions";
import { accessText } from "@/features/admin/components/gym-list";
import { RecordPlatformPayment } from "@/features/admin/components/record-platform-payment";
import { getGymDetail, listGymPlatformPayments, listPlatformPlans } from "@/features/admin/queries";
import { SUBSCRIPTION_STATUS, usageLevel } from "@/features/billing/status";
import { listProfileFlags } from "@/features/directory/queries";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/context";
import { formatDate, formatDateTime } from "@/lib/dates";
import { PAYMENT_METHOD_LABELS } from "@/lib/membership";
import { formatMNT } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import { cn, isUuid } from "@/lib/utils";

export const metadata: Metadata = { title: "Фитнес" };

export default async function AdminGymPage({ params }: PageProps<"/admin/gyms/[id]">) {
  const { id } = await params;
  const { today } = await requireAdmin();
  if (!isUuid(id)) notFound();
  const [gym, payments, plans, profiles] = await Promise.all([
    getGymDetail(id),
    listGymPlatformPayments(id),
    listPlatformPlans(),
    listProfileFlags(),
  ]);
  if (!gym) notFound();
  const profile = profiles.get(gym.gym_id);
  const writable = gym.status === "trial" || gym.status === "active";
  const listing = !profile
    ? { variant: "outline" as const, label: "Танилцуулга үүсгээгүй" }
    : !profile.isPublished
      ? { variant: "outline" as const, label: "Ноорог (нийтлээгүй)" }
      : !gym.verified_at
        ? { variant: "warning" as const, label: "Баталгаажуулбал нийтэд харагдана" }
        : !writable
          ? { variant: "danger" as const, label: "Эрх дууссан тул нуугдсан" }
          : { variant: "success" as const, label: "Нийтэд харагдаж байна" };

  const status = SUBSCRIPTION_STATUS[gym.status];
  const level = usageLevel(gym.client_count, gym.plan_max_clients);
  const latestValid = payments.find((p) => !p.voided_at)?.id;

  return (
    <div className="space-y-4">
      <Link href="/admin/gyms" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" />
        Фитнесүүд
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
            {gym.name}
            <Badge variant={status.variant}>{status.label}</Badge>
            {gym.verified_at ? <Badge variant="success">Баталгаажсан</Badge> : <Badge variant="outline">Баталгаажаагүй</Badge>}
          </h1>
          <p className="text-muted-foreground">Бүртгүүлсэн {formatDate(gym.created_at)}</p>
        </div>
        <RecordPlatformPayment
          gymId={gym.gym_id}
          gymName={gym.name}
          plans={plans}
          currentPlanId={gym.plan_id}
          today={today}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Платформын эрх</CardTitle>
            <CardDescription className={cn(gym.status === "past_due" && "text-destructive")}>{accessText(gym)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-muted-foreground">Туршилт</dt>
                <dd>{formatDate(gym.trial_ends_at)} хүртэл</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Төлсөн</dt>
                <dd>{gym.paid_until ? `${formatDate(gym.paid_until)} хүртэл` : "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Тариф</dt>
                <dd>{gym.plan_name ? `${gym.plan_name} · ${formatMNT(gym.plan_monthly_price)}/сар` : "Сонгоогүй"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Үйлчлүүлэгч</dt>
                <dd className={cn(level === "over" && "font-medium text-destructive", level === "near" && "text-amber-700")}>
                  {gym.client_count}
                  {gym.plan_max_clients ? ` / ${gym.plan_max_clients}` : ""} (идэвхтэй {gym.active_client_count})
                </dd>
              </div>
            </dl>
            {gym.suspended_at && (
              <p className="rounded-md bg-red-50 p-2 text-red-900">
                {formatDateTime(gym.suspended_at)}-д түр зогсоосон: {gym.suspended_reason}
              </p>
            )}
            <GymAdminActions
              gymId={gym.gym_id}
              verified={Boolean(gym.verified_at)}
              suspended={Boolean(gym.suspended_at)}
              status={gym.status}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Холбоо барих</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{gym.manager_name ?? "—"} (менежер)</p>
            {gym.manager_email && (
              <p className="flex items-center gap-2">
                <MailIcon className="size-4 text-muted-foreground" />
                <a href={`mailto:${gym.manager_email}`} className="text-primary">
                  {gym.manager_email}
                </a>
              </p>
            )}
            <p className="flex items-center gap-2">
              <PhoneIcon className="size-4 text-muted-foreground" />
              <a href={`tel:${gym.phone}`} className="text-primary">
                {formatPhone(gym.phone)}
              </a>
            </p>
            <p className="flex items-start gap-2">
              <MapPinIcon className="mt-0.5 size-4 text-muted-foreground" />
              {gym.address}
            </p>
            <p className="text-muted-foreground">Идэвхтэй ажилтан: {gym.staff_count}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Нийтийн танилцуулга</CardTitle>
          <CardDescription>
            “Фитнес хайх” хэсэгт зөвхөн менежер нийтэлсэн, баталгаажсан, эрх нь идэвхтэй фитнес харагдана.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge variant={listing.variant}>{listing.label}</Badge>
          {profile?.isPublished && gym.verified_at && writable && (
            <Button asChild variant="outline" size="sm">
              <a href={`/gyms/${profile.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon />
                Нийтийн хуудас
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Платформын төлбөрийн түүх</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Төлбөр бүртгэгдээгүй.</p>
          ) : (
            <ul className="divide-y">
              {payments.map((p) => (
                <li key={p.id} className={cn("flex flex-wrap items-start justify-between gap-2 py-3", p.voided_at && "opacity-60")}>
                  <div className="text-sm">
                    <div className="font-medium">
                      {p.plan_name} · {p.months} сар {p.voided_at && <Badge variant="danger">Хүчингүй</Badge>}
                    </div>
                    <div className="text-muted-foreground">
                      {formatDate(p.period_start)} – {formatDate(p.period_end)} · {formatDate(p.paid_on)}-нд ·{" "}
                      {PAYMENT_METHOD_LABELS[p.method]}
                      {p.recorder && ` · ${p.recorder.full_name}`}
                    </div>
                    {p.note && <div>{p.note}</div>}
                    {p.void_reason && <div className="text-destructive">Шалтгаан: {p.void_reason}</div>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={cn("font-semibold tabular-nums", p.voided_at && "line-through")}>{formatMNT(p.amount)}</span>
                    {p.id === latestValid && <VoidPlatformPaymentButton paymentId={p.id} gymId={gym.gym_id} />}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
