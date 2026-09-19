import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS } from "@/components/app-shell/nav-items";
import { ChangePasswordForm, ProfileForm } from "@/features/account/components/account-forms";
import { requireGymContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Миний бүртгэл" };

export default async function AccountPage() {
  const { userId, gym } = await requireGymContext();
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("full_name, phone").eq("id", userId).single();
  if (error) throw error;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Миний бүртгэл" description={`${gym.name} · ${ROLE_LABELS[gym.role]}`} className="mb-2" />
      <Card>
        <CardHeader>
          <CardTitle>Хувийн мэдээлэл</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm defaultValues={{ fullName: data.full_name, phone: data.phone ?? "" }} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Нууц үг солих</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
