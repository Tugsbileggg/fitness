import { ArrowLeftIcon, SearchIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { StatusScreen } from "@/components/status-screen";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Хуудас олдсонгүй" };

/** Нийтийн 404. Апп доторх 404 нь (app)/not-found.tsx (хажуугийн цэстэй). */
export default function NotFound() {
  return (
    <main className="dark flex min-h-svh flex-col bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-5">
        <Brand />
      </div>
      <StatusScreen
        code="404"
        title="Хуудас олдсонгүй"
        description="Таны хайсан хуудас устсан, хаяг нь өөрчлөгдсөн эсвэл буруу бичигдсэн байж магадгүй."
        className="flex-1 justify-center pb-24"
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/">
                <ArrowLeftIcon />
                Нүүр хуудас
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/gyms">
                <SearchIcon />
                Фитнес хайх
              </Link>
            </Button>
          </>
        }
      />
    </main>
  );
}
