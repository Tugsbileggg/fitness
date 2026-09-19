import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { TrainerForm } from "@/features/trainers/components/trainer-form";
import { trainerFormDefaults } from "@/features/trainers/schemas";
import { requireGymContext } from "@/lib/auth/context";

export const metadata: Metadata = { title: "Багш нэмэх" };

export default async function NewTrainerPage() {
  const { gym } = await requireGymContext({ managerOnly: true });
  if (!gym.isWritable) redirect("/trainers");

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Багш нэмэх" />
      <Card>
        <CardContent>
          <TrainerForm defaultValues={trainerFormDefaults()} />
        </CardContent>
      </Card>
    </div>
  );
}
