import { PencilIcon, PhoneIcon, WalletIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteClientButton } from "@/features/clients/components/delete-client-button";
import { getClient } from "@/features/clients/queries";
import { ageFromBirthYear, GENDER_LABELS } from "@/features/clients/schemas";
import { MembershipBadge } from "@/features/payments/components/membership-badge";
import { PaymentHistory } from "@/features/payments/components/payment-history";
import { getMembership, listClientPayments } from "@/features/payments/queries";
import { requireGymContext } from "@/lib/auth/context";
import { formatDate } from "@/lib/dates";
import { formatPhone } from "@/lib/phone";
import { isUuid } from "@/lib/utils";

export const metadata: Metadata = { title: "Үйлчлүүлэгч" };

export default async function ClientPage({ params }: PageProps<"/clients/[id]">) {
  const { id } = await params;
  const { gym, today } = await requireGymContext();
  if (!isUuid(id)) notFound();
  const [client, membership, payments] = await Promise.all([
    getClient(gym.id, id),
    getMembership(id),
    gym.isManager ? listClientPayments(gym.id, id) : Promise.resolve([]),
  ]);
  if (!client || client.deleted_at) notFound();
  const endsOn = membership?.ends_on ?? null;

  const details: Array<[string, React.ReactNode]> = [
    [
      "Утас",
      <a key="phone" href={`tel:${client.phone}`} className="inline-flex items-center gap-1.5 text-primary">
        <PhoneIcon className="size-4" />
        {formatPhone(client.phone)}
      </a>,
    ],
    ["Хүйс", GENDER_LABELS[client.gender]],
    ["Төрсөн он", `${client.birth_year} (${ageFromBirthYear(client.birth_year, today)} настай)`],
    [
      "Хариуцсан багш",
      client.trainer ? `${client.trainer.full_name}${client.trainer.is_active ? "" : " (идэвхгүй)"}` : "—",
    ],
    ["Бүртгэсэн", `${formatDate(client.created_at)}${client.creator ? `, ${client.creator.full_name}` : ""}`],
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title={client.full_name}
        className="mb-2"
        actions={
          gym.isWritable && (
            <>
              <Button asChild variant="outline">
                <Link href={`/clients/${client.id}/edit`}>
                  <PencilIcon />
                  Засах
                </Link>
              </Button>
              {gym.isManager && <DeleteClientButton clientId={client.id} clientName={client.full_name} />}
            </>
          )
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            Эрх <MembershipBadge endsOn={endsOn} today={today} threshold={gym.expiringThresholdDays} />
          </CardTitle>
          <CardDescription>
            {endsOn
              ? `${membership?.last_plan_name ?? "Багц"} · ${formatDate(membership?.starts_on)} – ${formatDate(endsOn)}`
              : "Одоогоор эрхийн төлбөр бүртгэгдээгүй байна."}
          </CardDescription>
        </CardHeader>
        {gym.isWritable && (
          <CardContent>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href={`/clients/${client.id}/pay`}>
                <WalletIcon />
                {endsOn ? "Төлбөр бүртгэх / Сунгах" : "Төлбөр бүртгэх"}
              </Link>
            </Button>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Мэдээлэл</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          {client.notes && (
            <div className="mt-4 rounded-lg bg-muted p-3 text-sm whitespace-pre-line">{client.notes}</div>
          )}
        </CardContent>
      </Card>

      {gym.isManager && (
        <Card>
          <CardHeader>
            <CardTitle>Төлбөрийн түүх</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentHistory payments={payments} clientId={client.id} canVoid={gym.isWritable} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
