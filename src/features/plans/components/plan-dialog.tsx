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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { savePlan } from "../actions";
import { planFormDefaults, planSchema, type PlanInput, type PlanValues } from "../schemas";

export function PlanDialog({
  plan,
  trigger,
}: {
  plan?: { id: string; name: string; duration_months: number; price: number; is_active: boolean };
  trigger: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<PlanInput, unknown, PlanValues>({
    resolver: zodResolver(planSchema),
    defaultValues: planFormDefaults(plan),
  });

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      form.reset(planFormDefaults(plan));
      setError(null);
    }
  };

  const onSubmit = form.handleSubmit(() => {
    const values = form.getValues();
    setError(null);
    startTransition(async () => {
      const result = await savePlan(plan?.id ?? null, values);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{plan ? "Багц засах" : "Шинэ багц"}</DialogTitle>
          <DialogDescription>
            Үнэ өөрчлөгдсөн ч өмнө бүртгэсэн төлбөрүүд хуучин үнээрээ хадгалагдана.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <FormError message={error} />
            <TextField control={form.control} name="name" label="Багцын нэр" placeholder="Жишээ: 3 сар" />
            <TextField
              control={form.control}
              name="durationMonths"
              label="Хугацаа (сар)"
              inputMode="numeric"
              maxLength={2}
              description="1 сар = 1, хагас жил = 6, 1 жил = 12"
            />
            <Controller
              control={form.control}
              name="price"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="price">Үнэ</FieldLabel>
                  <MoneyInput
                    id="price"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-invalid={fieldState.invalid}
                    placeholder="80,000"
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <input
                    id="isActive"
                    type="checkbox"
                    className="size-5 accent-primary"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                  <div>
                    <FieldLabel htmlFor="isActive">Идэвхтэй</FieldLabel>
                    <FieldDescription>Идэвхгүй багц төлбөрийн маягтад харагдахгүй.</FieldDescription>
                  </div>
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
