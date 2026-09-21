import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/config";

/** Нэвтрээгүй хэрэглэгчийн хуудсуудын толгой (нүүр, фитнес хайх). */
export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        <Brand />
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Үндсэн цэс">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/gyms">
              <SearchIcon />
              Фитнес хайх
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="sm:hidden" aria-label="Фитнес хайх">
            <Link href="/gyms">
              <SearchIcon />
            </Link>
          </Button>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/login">Нэвтрэх</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Бүртгүүлэх</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <span>
          © {new Date().getFullYear()} {APP_NAME}
        </span>
        <nav className="flex gap-4" aria-label="Доод цэс">
          <Link href="/gyms" className="hover:text-foreground">
            Фитнес хайх
          </Link>
          <Link href="/register" className="hover:text-foreground">
            Фитнесээ бүртгүүлэх
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Нэвтрэх
          </Link>
        </nav>
      </div>
    </footer>
  );
}
