"use client";

import { EyeIcon, EyeOffIcon, PencilIcon, SparklesIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/validation";
import { addStarterPlans, deletePlan, setPlanActive } from "../actions";
import type { PlanRow } from "../queries";
import { PlanDialog } from "./plan-dialog";

function useAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<ActionResult>) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message ?? "Амжилттай");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  return { pending, run };
}

export function PlanRowActions({ plan }: { plan: PlanRow }) {
  const { pending, run } = useAction();
  return (
    <div className="flex shrink-0 gap-1">
      <PlanDialog
        plan={plan}
        trigger={
          <Button variant="ghost" size="icon" aria-label="Засах">
            <PencilIcon />
          </Button>
        }
      />
      <Button
        variant="ghost"
        size="icon"
        disabled={pending}
        aria-label={plan.is_active ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
        title={plan.is_active ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
        onClick={() => run(() => setPlanActive(plan.id, !plan.is_active))}
      >
        {plan.is_active ? <EyeOffIcon /> : <EyeIcon />}
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Устгах" disabled={pending}>
            <Trash2Icon />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>&quot;{plan.name}&quot; багцыг устгах уу?</AlertDialogTitle>
            <AlertDialogDescription>
              Шинэ төлбөрт сонгох боломжгүй болно. Өмнө бүртгэсэн төлбөрүүд хэвээр үлдэнэ.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Болих</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => run(() => deletePlan(plan.id))}>
              Устгах
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function AddStarterPlansButton() {
  const { pending, run } = useAction();
  return (
    <Button variant="outline" disabled={pending} onClick={() => run(addStarterPlans)}>
      <SparklesIcon />
      Түгээмэл багцууд нэмэх (1, 3, 6, 12 сар)
    </Button>
  );
}
