import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SetPasswordForm } from "@/features/auth/components/set-password-form";

export const metadata: Metadata = { title: "Нууц үг тохируулах" };

export default function SetPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Шинэ нууц үг тохируулах</CardTitle>
        <CardDescription>Дараа нэвтрэхдээ энэ нууц үгийг ашиглана.</CardDescription>
      </CardHeader>
      <CardContent>
        <SetPasswordForm />
      </CardContent>
    </Card>
  );
}
