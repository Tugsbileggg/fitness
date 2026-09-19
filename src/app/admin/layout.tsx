import { LogOutIcon } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { signOut } from "@/features/auth/actions";
import { requireAdmin } from "@/lib/auth/context";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { fullName } = await requireAdmin();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 lg:px-8">
          <Brand href="/admin" />
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Админ
          </span>
          <span className="ml-auto hidden text-sm text-muted-foreground sm:inline">{fullName}</span>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOutIcon />
              Гарах
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      <Toaster />
    </div>
  );
}
