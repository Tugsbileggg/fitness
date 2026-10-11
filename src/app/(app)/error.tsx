"use client";

import { RotateCwIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { StatusScreen } from "@/components/status-screen";
import { Button } from "@/components/ui/button";

/** Апп доторх алдаа. Хажуугийн цэс хэвээр тул хэрэглэгч өөр хуудас руу шилжиж болно. */
export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <StatusScreen
      icon={TriangleAlertIcon}
      title="Алдаа гарлаа"
      description="Мэдээллийг ачаалж чадсангүй. Интернэт холболтоо шалгаад дахин оролдоно уу."
      footnote={error.digest && `Алдааны код: ${error.digest}`}
      actions={
        <>
          <Button onClick={() => retry()}>
            <RotateCwIcon />
            Дахин оролдох
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Хяналт руу буцах</Link>
          </Button>
        </>
      }
    />
  );
}
