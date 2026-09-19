"use client";

import { Loader2Icon, SearchIcon, XIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Нэр/утсаар хайх ба багшаар шүүх. Утгууд URL-д хадгалагдана (буцах товч, хуваалцахад). */
export function ClientFilters({ trainers }: { trainers: { id: string; full_name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function update(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    const query = params.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  }

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function onSearchChange(value: string) {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => update({ q: value.trim() || null }), 350);
  }

  const trainer = searchParams.get("trainer") ?? "all";

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={q}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Нэр эсвэл утсаар хайх"
          className="pr-10 pl-9"
          aria-label="Үйлчлүүлэгч хайх"
        />
        {pending ? (
          <Loader2Icon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : (
          q && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 right-0.5 -translate-y-1/2"
              onClick={() => onSearchChange("")}
              aria-label="Хайлтыг цэвэрлэх"
            >
              <XIcon />
            </Button>
          )
        )}
      </div>
      {trainers.length > 0 && (
        <Select value={trainer} onValueChange={(v) => update({ trainer: v === "all" ? null : v })}>
          <SelectTrigger className="w-full sm:w-56" aria-label="Багшаар шүүх">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх багш</SelectItem>
            <SelectItem value="none">Багшгүй</SelectItem>
            {trainers.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
