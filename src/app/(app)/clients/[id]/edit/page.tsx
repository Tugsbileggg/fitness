import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ClientForm } from "@/features/clients/components/client-form";
import { getClient } from "@/features/clients/queries";
import { clientFormDefaults } from "@/features/clients/schemas";
import { trainerOptions } from "@/features/trainers/queries";
import { requireGymContext } from "@/lib/auth/context";
import { isUuid } from "@/lib/utils";

export const metadata: Metadata = { title: "Үйлчлүүлэгч засах" };

export default async function EditClientPage({ params }: PageProps<"/clients/[id]/edit">) {
  const { id } = await params;
  const { gym } = await requireGymContext();
  if (!isUuid(id)) notFound();
  const client = await getClient(gym.id, id);
  if (!client || client.deleted_at) notFound();
  if (!gym.isWritable) redirect(`/clients/${id}`);
  const trainers = await trainerOptions(gym.id, client.assigned_trainer_id);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Үйлчлүүлэгч засах" description={client.full_name} />
      <Card>
        <CardContent>
          <ClientForm clientId={client.id} defaultValues={clientFormDefaults(client)} trainers={trainers} />
        </CardContent>
      </Card>
    </div>
  );
}
