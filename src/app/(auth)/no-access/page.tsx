import { ShieldOffIcon } from "lucide-react";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut } from "@/features/auth/actions";

export const metadata: Metadata = { title: "Эрх байхгүй" };

// Нэвтэрсэн ч аль ч фитнест идэвхтэй эрхгүй хэрэглэгч (жишээ нь идэвхгүй болгосон багш).
export default function NoAccessPage() {
  return (
    <Card className="text-center">
      <CardHeader>
        <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-muted">
          <ShieldOffIcon className="size-7 text-muted-foreground" />
        </div>
        <CardTitle className="text-xl">Нэвтрэх эрх идэвхгүй байна</CardTitle>
        <CardDescription className="text-base">
          Таны бүртгэл аль ч фитнест идэвхтэй эрхгүй байна. Фитнесийнхээ менежертэй холбогдоно уу.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={signOut}>
          <Button type="submit" variant="outline" className="w-full">
            Гарах
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
