import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/features/auth/components/register-form";
import { TRIAL_DAYS } from "@/lib/config";

export const metadata: Metadata = { title: "Фитнес бүртгүүлэх" };

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Фитнесээ бүртгүүлэх</CardTitle>
        <CardDescription>
          Бүртгүүлмэгц {TRIAL_DAYS} хоногийн үнэгүй туршилт эхэлнэ. Карт, төлбөр шаардлагагүй.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RegisterForm />
        <p className="text-center text-sm text-muted-foreground">
          Бүртгэлтэй юу?{" "}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Нэвтрэх
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
