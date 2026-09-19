import type { Metadata } from "next";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Нэвтрэх" };

const ERRORS: Record<string, string> = {
  link: "Холбоосны хугацаа дууссан эсвэл буруу байна. Дахин оролдоно уу.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : null;
  const error = typeof params.error === "string" ? ERRORS[params.error] : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Нэвтрэх</CardTitle>
        <CardDescription>Фитнесийн бүртгэлдээ нэвтэрнэ үү</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="danger">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <LoginForm next={next} />
        <p className="text-center text-sm text-muted-foreground">
          Фитнесээ бүртгүүлээгүй юу?{" "}
          <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
            Бүртгүүлэх
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
