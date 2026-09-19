import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoUploader } from "@/features/settings/components/logo-uploader";
import { SettingsForm } from "@/features/settings/components/settings-form";
import { requireGymContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Тохиргоо" };

export default async function SettingsPage() {
  const { gym } = await requireGymContext({ managerOnly: true });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gyms")
    .select("name, address, phone, expiring_threshold_days")
    .eq("id", gym.id)
    .single();
  if (error) throw error;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Тохиргоо" description="Фитнесийн мэдээлэл ба хяналтын самбарын тохиргоо" className="mb-2" />
      <Card>
        <CardHeader>
          <CardTitle>Лого</CardTitle>
          <CardDescription>Цэсний дээд хэсэгт харагдана.</CardDescription>
        </CardHeader>
        <CardContent>
          <LogoUploader gymId={gym.id} gymName={gym.name} logoUrl={gym.logoUrl} disabled={!gym.isWritable} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Фитнесийн мэдээлэл</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm
            disabled={!gym.isWritable}
            defaultValues={{
              name: data.name,
              address: data.address,
              phone: data.phone,
              expiringThresholdDays: String(data.expiring_threshold_days),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
