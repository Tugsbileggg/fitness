import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrainerAccessCard } from "@/features/trainers/components/trainer-access-card";
import { TrainerForm } from "@/features/trainers/components/trainer-form";
import { getTrainer } from "@/features/trainers/queries";
import { trainerFormDefaults } from "@/features/trainers/schemas";
import { requireGymContext } from "@/lib/auth/context";
import { isUuid } from "@/lib/utils";

export const metadata: Metadata = { title: "Багш" };

export default async function TrainerPage({ params }: PageProps<"/trainers/[id]">) {
  const { id } = await params;
  const { gym } = await requireGymContext({ managerOnly: true });
  if (!isUuid(id)) notFound();
  const trainer = await getTrainer(gym.id, id);
  if (!trainer) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title={trainer.full_name} description={trainer.specialization ?? "Багш"} className="mb-2" />
      <TrainerAccessCard
        trainerId={trainer.id}
        email={trainer.email}
        isActive={trainer.is_active}
        account={trainer.account}
        disabled={!gym.isWritable}
      />
      <Card>
        <CardHeader>
          <CardTitle>Мэдээлэл</CardTitle>
        </CardHeader>
        <CardContent>
          <TrainerForm
            trainerId={trainer.id}
            defaultValues={trainerFormDefaults(trainer)}
            disabled={!gym.isWritable}
          />
        </CardContent>
      </Card>
    </div>
  );
}
