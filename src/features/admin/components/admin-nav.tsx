"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Тойм", exact: true },
  { href: "/admin/gyms", label: "Фитнесүүд" },
  { href: "/admin/payments", label: "Төлбөрүүд" },
  { href: "/admin/plans", label: "Тарифууд" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="-mx-4 mb-6 flex gap-1 overflow-x-auto border-b px-4 lg:-mx-8 lg:px-8" aria-label="Админ цэс">
      {ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px shrink-0 border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground",
              active && "border-primary text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
