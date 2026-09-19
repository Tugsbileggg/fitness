import { Building2Icon, CheckIcon, PhoneIcon } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SUBSCRIPTION_STATUS, usageLevel } from "@/features/billing/status";
import { requireGymContext } from "@/lib/auth/context";
import { TRIAL_DAYS } from "@/lib/config";
import { formatDate } from "@/lib/dates";
import { PAYMENT_METHOD_LABELS } from "@/lib/membership";
import { formatMNT } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import { getPlatformContact } from "@/lib/platform";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Платформын эрх" };

export default async function BillingPage() {
  const { gym } = await requireGymContext({ managerOnly: true });
  const supabase = await createClient();
  const [usageRes, plansRes, paymentsRes, gymRes] = await Promise.all([
    supabase.rpc("gym_usage", { p_gym_id: gym.id }).maybeSingle(),
    supabase
      .from("platform_plans")
      .select("id, name, description, max_clients, monthly_price")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("platform_payments")
      .select("id, plan_name, months, amount, paid_on, method, period_start, period_end, voided_at")
      .eq("gym_id", gym.id)
      .order("seq", { ascending: false }),
    supabase.from("gyms").select("phone").eq("id", gym.id).single(),
  ]);
  for (const r of [usageRes, plansRes, paymentsRes, gymRes]) if (r.error) throw r.error;

  const usage = usageRes.data;
  const plans = plansRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const contact = getPlatformContact();
  const status = SUBSCRIPTION_STATUS[gym.status];
  const level = usageLevel(usage?.client_count ?? 0, usage?.max_clients ?? null);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Платформын эрх" description="Системийн сарын ашиглалтын төлбөр" className="mb-2" />

      <Card>
        <CardHeader>
          <CardDescription>Одоогийн төлөв</CardDescription>
          <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
            <Badge variant={status.variant}>{status.label}</Badge>
            {gym.accessEndsOn && (
              <span>
                {gym.status === "past_due" ? `${formatDate(gym.accessEndsOn)}-нд дууссан` : `${formatDate(gym.accessEndsOn)} хүртэл`}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {gym.status === "trial" && (
            <p className="text-muted-foreground">
              {TRIAL_DAYS} хоногийн үнэгүй туршилт. Туршилт дуусахаас өмнө төлбөрөө шилжүүлбэл тасралтгүй
              ажиллана. Төлсөн хугацаа туршилт дууссаны дараагаас тооцогдоно.
            </p>
          )}
          {gym.status === "suspended" && (
            <p className="text-destructive">
              Платформын админ таны эрхийг түр зогсоосон байна.{" "}
              {contact.supportPhone ? "Доорх утсаар холбогдоно уу." : "Платформын админтай холбогдоно уу."}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <span>
              Тариф: <span className="font-medium">{usage?.plan_name ?? "Сонгоогүй"}</span>
            </span>
            <span className={cn(level === "over" && "font-medium text-destructive", level === "near" && "text-amber-700")}>
              Үйлчлүүлэгч: {usage?.client_count ?? 0}
              {usage?.max_clients ? ` / ${usage.max_clients}` : ""}
            </span>
          </div>
          {level === "over" && (
            <p className="text-destructive">
              Үйлчлүүлэгчийн тоо тарифын хязгаараас хэтэрсэн байна. Дараагийн төлбөрөөс том тариф сонгоно уу.
            </p>
          )}
        </CardContent>
      </Card>

      <Alert variant="info">
        <Building2Icon />
        <AlertTitle>Төлбөр төлөх</AlertTitle>
        <AlertDescription className="space-y-2">
          {contact.bankAccount ? (
            <p>
              <span className="font-medium">{contact.bankName}</span> — данс{" "}
              <span className="font-mono font-medium">{contact.bankAccount}</span>
              {contact.bankAccountHolder && <>, эзэмшигч {contact.bankAccountHolder}</>}.
            </p>
          ) : (
            <p>Дансны мэдээллийг платформын админаас авна уу.</p>
          )}
          <p>
            Гүйлгээний утга дээр фитнесийн утасны дугаараа (<span className="font-mono">{formatPhone(gymRes.data?.phone)}</span>)
            бичнэ үү. Шилжүүлсний дараа админ баталгаажуулж, эрхийг тань сунгана.
          </p>
          {contact.supportPhone && (
            <p className="inline-flex items-center gap-1.5">
              <PhoneIcon className="size-4" />
              <a href={`tel:${contact.supportPhone}`} className="font-medium underline">
                {formatPhone(contact.supportPhone)}
              </a>
            </p>
          )}
        </AlertDescription>
      </Alert>

      {plans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Тарифууд</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={cn("rounded-lg border p-3", plan.name === usage?.plan_name && "border-primary bg-accent")}
              >
                <div className="flex items-center justify-between gap-2 font-medium">
                  {plan.name}
                  {plan.name === usage?.plan_name && <CheckIcon className="size-4 text-primary" />}
                </div>
                <div className="text-lg font-semibold">{formatMNT(plan.monthly_price)} / сар</div>
                <div className="text-sm text-muted-foreground">
                  {plan.max_clients ? `${plan.max_clients} хүртэл үйлчлүүлэгч` : "Хязгааргүй үйлчлүүлэгч"}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Төлбөрийн түүх</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Платформын төлбөр бүртгэгдээгүй байна.</p>
          ) : (
            <ul className="divide-y">
              {payments.map((p) => (
                <li key={p.id} className={cn("flex justify-between gap-3 py-2.5", p.voided_at && "opacity-60")}>
                  <div>
                    <div className="font-medium">
                      {p.plan_name} · {p.months} сар {p.voided_at && <Badge variant="danger">Хүчингүй</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(p.period_start)} – {formatDate(p.period_end)} · {formatDate(p.paid_on)}-нд ·{" "}
                      {PAYMENT_METHOD_LABELS[p.method]}
                    </div>
                  </div>
                  <div className={cn("font-semibold tabular-nums", p.voided_at && "line-through")}>{formatMNT(p.amount)}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
