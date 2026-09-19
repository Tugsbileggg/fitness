import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ClientForm } from "@/features/clients/components/client-form";
import { clientFormDefaults } from "@/features/clients/schemas";
import { trainerOptions } from "@/features/trainers/queries";
import { requireGymContext } from "@/lib/auth/context";

export const metadata: Metadata = { title: "Үйлчлүүлэгч нэмэх" };

export default async function NewClientPage() {
  const { gym } = await requireGymContext();
  if (!gym.isWritable) redirect("/clients");
  const trainers = await trainerOptions(gym.id);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Үйлчлүүлэгч нэмэх" />
      <Card>
        <CardContent>
          <ClientForm defaultValues={clientFormDefaults()} trainers={trainers} />
        </CardContent>
      </Card>
    </div>
  );
}
