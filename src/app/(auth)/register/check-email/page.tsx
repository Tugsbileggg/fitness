import { MailCheckIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Имэйлээ шалгана уу" };

export default function CheckEmailPage() {
  return (
    <Card className="text-center">
      <CardHeader className="items-center">
        <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <MailCheckIcon className="size-7" />
        </div>
        <CardTitle className="text-xl">Имэйлээ шалгана уу</CardTitle>
        <CardDescription className="text-base">
          Бүртгэл амжилттай үүслээ. Таны имэйл хаяг руу баталгаажуулах холбоос илгээлээ.
          Холбоос дээр дарсны дараа системд нэвтэрнэ.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>Имэйл ирэхгүй бол &quot;Spam&quot; хавтсаа шалгана уу.</p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Нэвтрэх хуудас руу</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
