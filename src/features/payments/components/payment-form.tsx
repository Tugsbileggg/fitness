"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ChoiceGroup } from "@/components/form/choice-group";
import { applyFieldErrors, FormError, SubmitButton, TextareaField } from "@/components/form/fields";
import { MoneyInput } from "@/components/form/money-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { addDaysISO, formatDate, isISODate } from "@/lib/dates";
import {
  computeDiscount,
  computePeriod,
  DiscountError,
  durationLabel,
  type DiscountType,
} from "@/lib/membership";
import { formatMNT, parseMNT } from "@/lib/money";
import { recordPayment } from "../actions";
import { paymentSchema, type PaymentInput, type PaymentValues } from "../schemas";

type Plan = { id: string; name: string; duration_months: number; price: number };

function preview(plan: Plan | undefined, currentEnd: string | null, values: PaymentInput) {
  // Огнооны талбар хоосон/дутуу үед тооцоо хийхгүй (addMonthsISO алдаа шиднэ).
  if (!plan || !isISODate(values.paidOn)) return null;
  const period = computePeriod(currentEnd, values.paidOn, plan.duration_months);
  let discount = 0;
  let discountError: string | null = null;
  try {
    const raw = values.discountValue ?? "";
    const value =
      values.discountType === "amount" ? (parseMNT(raw) ?? 0) : values.discountType === "percent" ? Number(raw || 0) : 0;
    discount = computeDiscount(plan.price, values.discountType as DiscountType, value);
  } catch (e) {
    if (e instanceof DiscountError) discountError = e.message;
    else throw e;
  }
  return { ...period, price: plan.price, discount, total: plan.price - discount, discountError };
}

export function PaymentForm({
  clientId,
  currentEnd,
  plans,
  today,
  returnTo,
}: {
  clientId: string;
  currentEnd: string | null;
  plans: Plan[];
  today: string;
  returnTo: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<PaymentInput, unknown, PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      planId: plans.length === 1 ? plans[0].id : (undefined as unknown as string),
      paidOn: today,
      method: "cash",
      discountType: "none",
      discountValue: "",
      note: "",
    },
  });

  const values = useWatch({ control: form.control }) as PaymentInput;
  const plan = plans.find((p) => p.id === values.planId);
  const summary = preview(plan, currentEnd, values);

  const onSubmit = form.handleSubmit(() => {
    const raw = form.getValues();
    setError(null);
    startTransition(async () => {
      const result = await recordPayment(clientId, raw);
      if (!result.ok) {
        setError(result.error);
        applyFieldErrors(form, result.fieldErrors);
        return;
      }
      toast.success(`Төлбөр бүртгэгдлээ: ${formatMNT(result.data.amount)}`, {
        description: `Эрх ${formatDate(result.data.endsOn)} хүртэл хүчинтэй.`,
      });
      router.push(returnTo);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <Card>
        <CardContent>
          <FieldGroup>
            <FormError message={error} />

            <Controller
              control={form.control}
              name="planId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Эрхийн багц</FieldLabel>
                  <ChoiceGroup
                    aria-label="Эрхийн багц"
                    value={field.value}
                    onChange={field.onChange}
                    invalid={fieldState.invalid}
                    options={plans.map((p) => ({
                      value: p.id,
                      label: <span className="font-medium">{p.name}</span>,
                      description: `${durationLabel(p.duration_months)} · ${formatMNT(p.price)}`,
                      ariaLabel: `${p.name}, ${formatMNT(p.price)}`,
                    }))}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="paidOn"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="paidOn">Төлсөн огноо</FieldLabel>
                  <Input
                    id="paidOn"
                    type="date"
                    max={today}
                    min={addDaysISO(today, -366)}
                    {...field}
                    aria-invalid={fieldState.invalid}
                    className="w-full sm:w-56"
                  />
                  {field.value && !fieldState.error && (
                    <FieldDescription>
                      {formatDate(field.value)}
                      {field.value === today && " (өнөөдөр)"}
                    </FieldDescription>
                  )}
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="method"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Төлбөрийн хэлбэр</FieldLabel>
                  <ChoiceGroup
                    aria-label="Төлбөрийн хэлбэр"
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      { value: "cash", label: "Бэлэн" },
                      { value: "bank_transfer", label: "Дансаар" },
                    ]}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="discountType"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Хөнгөлөлт</FieldLabel>
                  <ChoiceGroup
                    aria-label="Хөнгөлөлт"
                    columns={3}
                    value={field.value}
                    onChange={(v) => {
                      field.onChange(v);
                      form.setValue("discountValue", "");
                      form.clearErrors("discountValue");
                    }}
                    options={[
                      { value: "none", label: "Байхгүй" },
                      { value: "amount", label: "Дүнгээр" },
                      { value: "percent", label: "Хувиар" },
                    ]}
                  />
                </Field>
              )}
            />

            {values.discountType !== "none" && (
              <Controller
                control={form.control}
                name="discountValue"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || Boolean(summary?.discountError)}>
                    <FieldLabel htmlFor="discountValue">
                      {values.discountType === "amount" ? "Хөнгөлөлтийн дүн" : "Хөнгөлөлтийн хувь"}
                    </FieldLabel>
                    {values.discountType === "amount" ? (
                      <MoneyInput
                        id="discountValue"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        className="sm:w-56"
                        placeholder="10,000"
                      />
                    ) : (
                      <div className="relative sm:w-56">
                        <Input
                          id="discountValue"
                          inputMode="numeric"
                          maxLength={3}
                          placeholder="10"
                          className="pr-8"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                        />
                        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground">
                          %
                        </span>
                      </div>
                    )}
                    <FieldError>{fieldState.error?.message ?? summary?.discountError}</FieldError>
                  </Field>
                )}
              />
            )}

            <TextareaField control={form.control} name="note" label="Тэмдэглэл" optional rows={2} />
          </FieldGroup>
        </CardContent>
      </Card>

      <Card className="lg:sticky lg:top-6">
        <CardHeader>
          <CardTitle>Дүн</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {summary ? (
            <>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Багцын үнэ</dt>
                  <dd className="tabular-nums">{formatMNT(summary.price)}</dd>
                </div>
                {summary.discount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Хөнгөлөлт</dt>
                    <dd className="text-emerald-700 tabular-nums">−{formatMNT(summary.discount)}</dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between border-t pt-2">
                  <dt className="font-medium">Төлөх дүн</dt>
                  <dd className="text-2xl font-semibold tabular-nums">{formatMNT(summary.total)}</dd>
                </div>
              </dl>
              <div className="rounded-lg bg-accent p-3 text-accent-foreground">
                <div className="text-sm">{summary.extending ? "Сунгалт: одоогийн эрхийн араас" : "Шинэ эрх"}</div>
                <div className="mt-1 flex items-center gap-2 font-semibold">
                  {formatDate(summary.startsOn)}
                  <ArrowRightIcon className="size-4" />
                  {formatDate(summary.endsOn)}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Багц сонгоход дүн, эрхийн хугацаа энд харагдана.</p>
          )}
          <SubmitButton
            pending={pending}
            size="lg"
            className="w-full"
            disabled={!summary || Boolean(summary.discountError)}
          >
            Төлбөр бүртгэх
          </SubmitButton>
        </CardContent>
      </Card>
    </form>
  );
}
