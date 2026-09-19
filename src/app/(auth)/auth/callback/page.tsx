import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { HashSessionHandler } from "@/features/auth/components/hash-session-handler";

export const metadata: Metadata = { title: "Нэвтэрч байна" };

/**
 * Supabase-ийн анхдагч урилгын загвар (өөрийн SMTP-гүй үед) session-ийг URL-ийн #hash-д
 * дамжуулдаг бөгөөд сервер үүнийг уншиж чаддаггүй. Иймд browser дээр хүлээн авна.
 */
export default function AuthCallbackPage() {
  return (
    <Card>
      <CardContent>
        <Suspense>
          <HashSessionHandler />
        </Suspense>
      </CardContent>
    </Card>
  );
}
