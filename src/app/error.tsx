"use client";

import { RotateCwIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { StatusScreen } from "@/components/status-screen";
import { Button } from "@/components/ui/button";

/** Нийтийн хуудсуудын алдаа. Апп доторх нь (app)/error.tsx, root layout-ийнх global-error.tsx. */
export default function PublicError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="dark flex min-h-svh flex-col bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-5">
        <Brand />
      </div>
      <StatusScreen
        icon={TriangleAlertIcon}
        title="Алдаа гарлаа"
        description="Түр зуурын саатал байж магадгүй. Хэсэг хугацааны дараа дахин оролдоно уу."
        className="flex-1 justify-center pb-24"
        footnote={error.digest && `Алдааны код: ${error.digest}`}
        actions={
          <>
            <Button size="lg" onClick={() => retry()}>
              <RotateCwIcon />
              Дахин оролдох
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/">Нүүр хуудас</Link>
            </Button>
          </>
        }
      />
    </main>
  );
}
