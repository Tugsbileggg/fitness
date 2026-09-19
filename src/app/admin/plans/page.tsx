import { PencilIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlatformPlanDialog } from "@/features/admin/components/platform-plan-dialog";
import { listPlatformPlans } from "@/features/admin/queries";
import { formatMNT } from "@/lib/money";

export const metadata: Metadata = { title: "Тарифууд" };

export default async function AdminPlansPage() {
  const plans = await listPlatformPlans();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Платформын тарифууд</h1>
        <PlatformPlanDialog
          trigger={
            <Button>
              <PlusIcon />
              Тариф нэмэх
            </Button>
          }
        />
      </div>
      <Card className="divide-y p-0">
        {plans.length === 0 && <p className="p-4 text-sm text-muted-foreground">Тариф үүсгээгүй байна.</p>}
        {plans.map((plan) => (
          <div key={plan.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{plan.name}</span>
                {!plan.is_active && <Badge variant="muted">Идэвхгүй</Badge>}
              </div>
              <div className="text-sm text-muted-foreground">
                {plan.max_clients ? `${plan.max_clients} хүртэл үйлчлүүлэгч` : "Хязгааргүй"}
                {plan.description && ` · ${plan.description}`}
              </div>
            </div>
            <div className="font-semibold tabular-nums">{formatMNT(plan.monthly_price)}/сар</div>
            <PlatformPlanDialog
              plan={plan}
              trigger={
                <Button variant="ghost" size="icon" aria-label="Засах">
                  <PencilIcon />
                </Button>
              }
            />
          </div>
        ))}
      </Card>
    </div>
  );
}
