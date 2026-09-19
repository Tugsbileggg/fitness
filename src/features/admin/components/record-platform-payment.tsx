"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ChoiceGroup } from "@/components/form/choice-group";
import { applyFieldErrors, FormError, SubmitButton, TextareaField, TextField } from "@/components/form/fields";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/dates";
import { formatMNT } from "@/lib/money";
import { recordPlatformPayment } from "../actions";
import { platformPaymentSchema, type PlatformPaymentInput, type PlatformPaymentValues } from "../schemas";

type Plan = { id: string; name: string; monthly_price: number; is_active: boolean };

export function RecordPlatformPayment({
  gymId,
  gymName,
  plans,
  currentPlanId,
  today,
}: {
  gymId: string;
  gymName: string;
  plans: Plan[];
  currentPlanId: string | null;
  today: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const available = plans.filter((p) => p.is_active || p.id === currentPlanId);
  const initialPlan = available.find((p) => p.id === currentPlanId) ?? available[0];

  const defaults = (): PlatformPaymentInput => ({
    planId: initialPlan?.id ?? "",
    months: "1",
    amount: String(initialPlan?.monthly_price ?? ""),
    paidOn: today,
    method: "bank_transfer",
    note: "",
  });

  const form = useForm<PlatformPaymentInput, unknown, PlatformPaymentValues>({
    resolver: zodResolver(platformPaymentSchema),
    defaultValues: defaults(),
  });
  const planId = useWatch({ control: form.control, name: "planId" });
  const months = useWatch({ control: form.control, name: "months" });
  const plan = available.find((p) => p.id === planId);
  const suggested = plan && /^\d+$/.test(months) ? plan.monthly_price * Number(months) : null;

  // Тариф эсвэл сар өөрчлөгдөхөд дүнг санал болгох дүнгээр шинэчилнэ (гараар засаж болно).
  const syncAmount = (nextPlanId: string, nextMonths: string) => {
    const p = available.find((x) => x.id === nextPlanId);
    if (p && /^\d+$/.test(nextMonths)) form.setValue("amount", String(p.monthly_price * Number(nextMonths)));
  };

  const onSubmit = form.handleSubmit(() => {
    const values = form.getValues();
    setError(null);
    startTransition(async () => {
      const result = await recordPlatformPayment(gymId, values);
      if (!result.ok) {
        setError(result.error);
        applyFieldErrors(form, result.fieldErrors);
        return;
      }
      toast.success(result.message ?? "Бүртгэгдлээ", {
        description: `Эрх ${formatDate(result.data.periodEnd)} хүртэл сунгагдлаа.`,
      });
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
          form.reset(defaults());
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={available.length === 0}>
          <PlusIcon />
          Төлбөр бүртгэх
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Платформын төлбөр</DialogTitle>
          <DialogDescription>
            {gymName}. Эрх нь одоогийн дуусах огнооноос (хүчинтэй бол) үргэлжилж сунгагдана.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <FormError message={error} />
            <Controller
              control={form.control}
              name="planId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="platform-plan">Тариф</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      syncAmount(v, form.getValues("months"));
                    }}
                  >
                    <SelectTrigger id="platform-plan" className="w-full">
                      <SelectValue placeholder="Тариф сонгох" />
                    </SelectTrigger>
                    <SelectContent>
                      {available.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} · {formatMNT(p.monthly_price)}/сар
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="months"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="platform-months">Хэдэн сар</FieldLabel>
                  <Input
                    id="platform-months"
                    inputMode="numeric"
                    maxLength={2}
                    className="w-24"
                    {...field}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "");
                      field.onChange(v);
                      syncAmount(form.getValues("planId"), v);
                    }}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="amount"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="platform-amount">Төлсөн дүн</FieldLabel>
                  <MoneyInput id="platform-amount" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                  {suggested !== null && <FieldDescription>Тарифаар: {formatMNT(suggested)}</FieldDescription>}
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <TextField control={form.control} name="paidOn" label="Төлсөн огноо" type="date" max={today} className="sm:w-56" />
            <Controller
              control={form.control}
              name="method"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Хэлбэр</FieldLabel>
                  <ChoiceGroup
                    aria-label="Төлбөрийн хэлбэр"
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      { value: "bank_transfer", label: "Дансаар" },
                      { value: "cash", label: "Бэлэн" },
                    ]}
                  />
                </Field>
              )}
            />
            <TextareaField control={form.control} name="note" label="Тэмдэглэл" optional rows={2} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Болих
              </Button>
              <SubmitButton pending={pending}>Бүртгэх</SubmitButton>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
