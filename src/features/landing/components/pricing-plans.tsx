import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TRIAL_DAYS } from "@/lib/config";
import { formatMNT } from "@/lib/money";
import { cn } from "@/lib/utils";

export type LandingPlan = {
  id: string;
  name: string;
  description: string | null;
  max_clients: number | null;
  monthly_price: number;
};

/** Багцууд зөвхөн үйлчлүүлэгчийн хязгаараар ялгаатай. Гурван багц байвал дундахыг тодруулна. */
export function PricingPlans({ plans }: { plans: LandingPlan[] }) {
  const featured = plans.length === 3 ? 1 : -1;
  return (
    <div className={cn("grid gap-4", plans.length >= 3 ? "lg:grid-cols-3" : "md:grid-cols-2")}>
      {plans.map((plan, i) => {
        const isFeatured = i === featured;
        return (
          <div
            key={plan.id}
            className={cn(
              "relative flex flex-col gap-6 rounded-3xl border bg-card p-6 text-card-foreground",
              isFeatured && "dark border-transparent bg-background text-foreground lg:-my-3 lg:py-9",
            )}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                {isFeatured && (
                  <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-ink">Санал болгох</span>
                )}
              </div>
              {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
            </div>
            <p className="flex items-baseline gap-1.5">
              <span className="font-display text-3xl tracking-tight">{formatMNT(plan.monthly_price)}</span>
              <span className="text-sm text-muted-foreground">/ сар</span>
            </p>
            <ul className="space-y-2.5 text-sm">
              {[
                plan.max_clients ? `${plan.max_clients} хүртэл үйлчлүүлэгч` : "Хязгааргүй үйлчлүүлэгч",
                "Бүх боломж багтсан",
                `${TRIAL_DAYS} хоног үнэгүй туршилт`,
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full",
                      isFeatured ? "bg-brand text-ink" : "bg-accent text-accent-foreground",
                    )}
                  >
                    <CheckIcon className="size-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" variant={isFeatured ? "default" : "outline"} className="mt-auto">
              <Link href="/register">Туршиж үзэх</Link>
            </Button>
          </div>
        );
      })}
    </div>
  );
}
