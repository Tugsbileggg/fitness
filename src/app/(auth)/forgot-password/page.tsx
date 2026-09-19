import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = { title: "Нууц үг сэргээх" };

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Нууц үг сэргээх</CardTitle>
        <CardDescription>
          Бүртгэлтэй имэйл хаягаа оруулна уу. Шинэ нууц үг тохируулах холбоос илгээнэ.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ForgotPasswordForm />
        <p className="text-center text-sm">
          <Link href="/login" className="text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
            Нэвтрэх хуудас руу буцах
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
