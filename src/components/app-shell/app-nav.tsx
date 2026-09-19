"use client";

import { LogOutIcon, MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { signOut } from "@/features/auth/actions";
import type { StaffRole } from "@/lib/auth/context";
import { cn } from "@/lib/utils";
import { GymLogo } from "./gym-logo";
import { isActivePath, navItemsFor, ROLE_LABELS } from "./nav-items";
import { UserMenu } from "./user-menu";

type ShellProps = {
  gymName: string;
  logoUrl: string | null;
  role: StaffRole;
  fullName: string;
};

/** Компьютерийн хажуугийн цэс (lg-ээс дээш). */
export function DesktopSidebar({ gymName, logoUrl, role, fullName }: ShellProps) {
  const pathname = usePathname();
  const items = navItemsFor(role);

  return (
    <aside className="sticky top-0 hidden h-svh flex-col border-r bg-sidebar lg:flex">
      <div className="flex items-center gap-3 px-4 py-5">
        <GymLogo name={gymName} logoUrl={logoUrl} />
        <span className="line-clamp-2 text-sm leading-tight font-semibold">{gymName}</span>
      </div>
      <nav className="flex-1 space-y-1 px-3" aria-label="Үндсэн цэс">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                active && "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent",
              )}
            >
              <item.icon className="size-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <UserMenu fullName={fullName} roleLabel={ROLE_LABELS[role]} />
      </div>
    </aside>
  );
}

/** Утасны дээд мөр: фитнесийн нэр ба цэс. */
export function MobileHeader({ gymName, logoUrl, role, fullName }: ShellProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur lg:hidden">
      <GymLogo name={gymName} logoUrl={logoUrl} className="size-8" />
      <span className="min-w-0 flex-1 truncate font-semibold">{gymName}</span>
      <MobileMenu gymName={gymName} logoUrl={logoUrl} role={role} fullName={fullName} />
    </header>
  );
}

function MobileMenu({ gymName, logoUrl, role, fullName }: ShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = navItemsFor(role);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Цэс нээх">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 gap-0 p-0">
        <SheetHeader className="border-b">
          <div className="flex items-center gap-3">
            <GymLogo name={gymName} logoUrl={logoUrl} />
            <div className="min-w-0">
              <SheetTitle className="truncate">{gymName}</SheetTitle>
              <SheetDescription className="truncate">
                {fullName} · {ROLE_LABELS[role]}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <nav className="flex-1 space-y-1 p-3" aria-label="Бүх цэс">
          {items.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-lg px-3 font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                  active && "bg-accent text-accent-foreground",
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <Button
            variant="ghost"
            className="h-11 w-full justify-start gap-3 px-3 text-base text-muted-foreground"
            onClick={() => void signOut()}
          >
            <LogOutIcon className="size-5" />
            Гарах
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Утасны доод навигац: гол хуудсууд эрхий хуруунд ойр. */
export function MobileBottomNav({ role }: { role: StaffRole }) {
  const pathname = usePathname();
  const items = navItemsFor(role).filter((item) => item.primary);
  if (items.length < 2) return null;

  return (
    <nav
      aria-label="Доод цэс"
      className="fixed inset-x-0 bottom-0 z-30 grid border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground",
              active && "text-primary",
            )}
          >
            <item.icon className="size-5" />
            {item.shortLabel ?? item.label}
          </Link>
        );
      })}
    </nav>
  );
}
