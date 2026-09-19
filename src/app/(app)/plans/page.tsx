import { PlusIcon, TagsIcon } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlanDialog } from "@/features/plans/components/plan-dialog";
import { AddStarterPlansButton, PlanRowActions } from "@/features/plans/components/plan-row-actions";
import { listPlans } from "@/features/plans/queries";
import { requireGymContext } from "@/lib/auth/context";
import { durationLabel } from "@/lib/membership";
import { formatMNT } from "@/lib/money";

export const metadata: Metadata = { title: "Эрхийн багц" };

export default async function PlansPage() {
  const { gym } = await requireGymContext({ managerOnly: true });
  const plans = await listPlans(gym.id);

  const addButton = gym.isWritable ? (
    <PlanDialog
      trigger={
        <Button>
          <PlusIcon />
          Багц нэмэх
        </Button>
      }
    />
  ) : null;

  return (
    <>
      <PageHeader
        title="Эрхийн багц"
        description="Үйлчлүүлэгчид сонгох сарын эрхүүд ба үнэ"
        actions={plans.length > 0 ? addButton : null}
      />

      {plans.length === 0 ? (
        <EmptyState
          icon={TagsIcon}
          title="Багц үүсгээгүй байна"
          description="Төлбөр бүртгэхийн өмнө эрхийн багцаа (жишээ нь 1 сар, 3 сар) үнэтэй нь тохируулна."
          action={
            gym.isWritable && (
              <div className="flex flex-col gap-2 sm:flex-row">
                {addButton}
                <AddStarterPlansButton />
              </div>
            )
          }
        />
      ) : (
        <Card className="divide-y p-0">
          {plans.map((plan) => (
            <div key={plan.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{plan.name}</span>
                  {!plan.is_active && <Badge variant="muted">Идэвхгүй</Badge>}
                </div>
                <div className="text-sm text-muted-foreground">{durationLabel(plan.duration_months)}</div>
              </div>
              <div className="text-right font-semibold tabular-nums">{formatMNT(plan.price)}</div>
              {gym.isWritable && <PlanRowActions plan={plan} />}
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
