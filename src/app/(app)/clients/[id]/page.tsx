import { PencilIcon, PhoneIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteClientButton } from "@/features/clients/components/delete-client-button";
import { getClient } from "@/features/clients/queries";
import { ageFromBirthYear, GENDER_LABELS } from "@/features/clients/schemas";
import { requireGymContext } from "@/lib/auth/context";
import { formatDate } from "@/lib/dates";
import { formatPhone } from "@/lib/phone";
import { isUuid } from "@/lib/utils";

export const metadata: Metadata = { title: "Үйлчлүүлэгч" };

export default async function ClientPage({ params }: PageProps<"/clients/[id]">) {
  const { id } = await params;
  const { gym, today } = await requireGymContext();
  if (!isUuid(id)) notFound();
  const client = await getClient(gym.id, id);
  if (!client || client.deleted_at) notFound();

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
          <CardTitle>Эрх</CardTitle>
          <CardDescription>Эрхийн багц, төлбөрийн бүртгэл дараагийн шатанд нэмэгдэнэ.</CardDescription>
        </CardHeader>
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
    </div>
  );
}
