"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { type ReactNode, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { applyFieldErrors, FormError, SubmitButton, TextField } from "@/components/form/fields";
import { MoneyInput } from "@/components/form/money-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { savePlatformPlan } from "../actions";
import { platformPlanSchema, type PlatformPlanInput, type PlatformPlanValues } from "../schemas";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  max_clients: number | null;
  monthly_price: number;
  is_active: boolean;
  sort_order: number;
};

function defaults(plan?: Plan): PlatformPlanInput {
  return {
    name: plan?.name ?? "",
    description: plan?.description ?? "",
    maxClients: plan?.max_clients ? String(plan.max_clients) : "",
    monthlyPrice: plan ? String(plan.monthly_price) : "",
    sortOrder: String(plan?.sort_order ?? 0),
    isActive: plan?.is_active ?? true,
  };
}

export function PlatformPlanDialog({ plan, trigger }: { plan?: Plan; trigger: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<PlatformPlanInput, unknown, PlatformPlanValues>({
    resolver: zodResolver(platformPlanSchema),
    defaultValues: defaults(plan),
  });

  const onSubmit = form.handleSubmit(() => {
    const values = form.getValues();
    setError(null);
    startTransition(async () => {
      const result = await savePlatformPlan(plan?.id ?? null, values);
      if (!result.ok) {
        setError(result.error);
        applyFieldErrors(form, result.fieldErrors);
        return;
      }
      toast.success(result.message ?? "Хадгаллаа");
      setOpen(false);
      router.refresh();
    });
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          form.reset(defaults(plan));
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{plan ? "Тариф засах" : "Шинэ тариф"}</DialogTitle>
          <DialogDescription>Идэвхтэй тарифууд нүүр хуудас болон фитнесийн төлбөрийн хуудсанд харагдана.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <FormError message={error} />
            <TextField control={form.control} name="name" label="Нэр" />
            <TextField control={form.control} name="description" label="Тайлбар" optional />
            <Controller
              control={form.control}
              name="monthlyPrice"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="monthlyPrice">Сарын үнэ</FieldLabel>
                  <MoneyInput id="monthlyPrice" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <TextField
              control={form.control}
              name="maxClients"
              label="Үйлчлүүлэгчийн дээд тоо"
              optional
              inputMode="numeric"
              description="Хоосон бол хязгааргүй. Хэтэрвэл зөвхөн анхааруулга гарна."
            />
            <TextField control={form.control} name="sortOrder" label="Эрэмбэ" inputMode="numeric" className="w-24" />
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <input
                    id="plan-active"
                    type="checkbox"
                    className="size-5 accent-primary"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                  <FieldLabel htmlFor="plan-active">Идэвхтэй</FieldLabel>
                </Field>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Болих
              </Button>
              <SubmitButton pending={pending}>Хадгалах</SubmitButton>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
