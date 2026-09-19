import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { GymList } from "@/features/admin/components/gym-list";
import { getGymOverview } from "@/features/admin/queries";
import { SUBSCRIPTION_STATUS } from "@/features/billing/status";
import type { SubscriptionStatus } from "@/lib/auth/context";
import { cn } from "@/lib/utils";
import { Building2Icon } from "lucide-react";

export const metadata: Metadata = { title: "Фитнесүүд" };

const FILTERS: Array<{ value: SubscriptionStatus | "all"; label: string }> = [
  { value: "all", label: "Бүгд" },
  ...(Object.entries(SUBSCRIPTION_STATUS) as Array<[SubscriptionStatus, { label: string }]>).map(([value, s]) => ({
    value,
    label: s.label,
  })),
];

export default async function AdminGymsPage({ searchParams }: PageProps<"/admin/gyms">) {
  const { status: statusParam, q: qParam } = await searchParams;
  const status = FILTERS.some((f) => f.value === statusParam) ? (statusParam as SubscriptionStatus) : "all";
  const q = typeof qParam === "string" ? qParam.trim().toLowerCase() : "";

  const gyms = await getGymOverview();
  const counts = Object.fromEntries(FILTERS.map((f) => [f.value, f.value === "all" ? gyms.length : gyms.filter((g) => g.status === f.value).length]));
  const rows = gyms.filter(
    (g) =>
      (status === "all" || g.status === status) &&
      (!q || g.name.toLowerCase().includes(q) || g.phone.includes(q) || (g.manager_email ?? "").toLowerCase().includes(q)),
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Фитнесүүд</h1>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/admin/gyms" : `/admin/gyms?status=${f.value}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm",
              status === f.value ? "border-primary bg-accent font-medium text-accent-foreground" : "hover:bg-muted",
            )}
          >
            {f.label} <span className="text-muted-foreground">{counts[f.value]}</span>
          </Link>
        ))}
      </div>

      <form className="max-w-sm">
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Нэр, утас, имэйлээр хайх"
          aria-label="Фитнес хайх"
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </form>

      {rows.length === 0 ? (
        <EmptyState icon={Building2Icon} title="Фитнес олдсонгүй" />
      ) : (
        <Card className="p-0">
          <GymList rows={rows} />
        </Card>
      )}
    </div>
  );
}
