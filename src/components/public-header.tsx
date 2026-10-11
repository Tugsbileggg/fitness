import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Нэвтрээгүй хэрэглэгчийн хуудсуудын толгой (нүүр, фитнес хайх).
 * Нүүр хуудас `className="dark"` дамжуулж бараан хувилбарыг гаргана.
 */
export function PublicHeader({ className }: { className?: string }) {
  return (
    <header className={cn("sticky top-0 z-30 border-b bg-background/90 text-foreground backdrop-blur-md", className)}>
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
          <Button asChild variant="ghost" className="hidden md:inline-flex">
            <Link href="/#pricing">Үнэ</Link>
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

export function PublicFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("border-t bg-background text-foreground", className)}>
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Brand className="text-foreground" />
          <span>© {new Date().getFullYear()}</span>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Доод цэс">
          <Link href="/gyms" className="hover:text-foreground">
            Фитнес хайх
          </Link>
          <Link href="/#pricing" className="hover:text-foreground">
            Үнэ
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
