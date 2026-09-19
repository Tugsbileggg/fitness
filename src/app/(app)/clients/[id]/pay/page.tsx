import { TagsIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getClient } from "@/features/clients/queries";
import { MembershipBadge } from "@/features/payments/components/membership-badge";
import { PaymentForm } from "@/features/payments/components/payment-form";
import { getMembership } from "@/features/payments/queries";
import { listPlans } from "@/features/plans/queries";
import { requireGymContext } from "@/lib/auth/context";
import { formatDate } from "@/lib/dates";
import { isUuid } from "@/lib/utils";

export const metadata: Metadata = { title: "Төлбөр бүртгэх" };

export default async function PayPage({ params, searchParams }: PageProps<"/clients/[id]/pay">) {
  const { id } = await params;
  const { from } = await searchParams;
  const { gym, today } = await requireGymContext();
  if (!isUuid(id)) notFound();
  if (!gym.isWritable) redirect(`/clients/${id}`);

  const [client, membership, plans] = await Promise.all([
    getClient(gym.id, id),
    getMembership(id),
    listPlans(gym.id, true),
  ]);
  if (!client || client.deleted_at) notFound();

  const returnTo = from === "dashboard" ? "/dashboard" : `/clients/${id}`;
  const endsOn = membership?.ends_on ?? null;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Төлбөр бүртгэх"
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{client.full_name}</span>
            <MembershipBadge endsOn={endsOn} today={today} threshold={gym.expiringThresholdDays} />
            {endsOn && <span>Одоогийн эрх: {formatDate(endsOn)} хүртэл</span>}
          </span>
        }
      />
      {plans.length === 0 ? (
        <EmptyState
          icon={TagsIcon}
          title="Идэвхтэй эрхийн багц алга"
          description={
            gym.isManager
              ? "Эхлээд эрхийн багцаа (1 сар, 3 сар гэх мэт) үнэтэй нь үүсгэнэ үү."
              : "Менежер эрхийн багцаа үүсгэсний дараа төлбөр бүртгэх боломжтой."
          }
          action={
            gym.isManager && (
              <Button asChild>
                <Link href="/plans">Багц үүсгэх</Link>
              </Button>
            )
          }
        />
      ) : (
        <PaymentForm clientId={client.id} currentEnd={endsOn} plans={plans} today={today} returnTo={returnTo} />
      )}
    </div>
  );
}
