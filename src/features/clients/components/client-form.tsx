"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  applyFieldErrors,
  FormError,
  SubmitButton,
  TextareaField,
  TextField,
} from "@/components/form/fields";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createClientRecord, updateClientRecord } from "../actions";
import { clientSchema, GENDER_LABELS, type ClientInput, type ClientValues } from "../schemas";

type TrainerOption = { id: string; full_name: string; is_active: boolean };

export function ClientForm({
  clientId,
  defaultValues,
  trainers,
  disabled,
}: {
  clientId?: string;
  defaultValues: ClientInput;
  trainers: TrainerOption[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ClientInput, unknown, ClientValues>({ resolver: zodResolver(clientSchema), defaultValues });

  // Client талд шалгасны дараа анхны (transform хийгээгүй) утгуудыг илгээнэ; server дахин шалгана.
  const onSubmit = form.handleSubmit(() => {
    const values = form.getValues();
    setError(null);
    startTransition(async () => {
      const result = clientId
        ? await updateClientRecord(clientId, values)
        : await createClientRecord(values);
      if (!result.ok) {
        setError(result.error);
        applyFieldErrors(form, result.fieldErrors);
        return;
      }
      toast.success(result.message ?? "Хадгаллаа");
      const id = clientId ?? (result.data as { id: string }).id;
      router.push(`/clients/${id}`);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <fieldset disabled={disabled || pending} className="contents">
        <FieldGroup>
          <FormError message={error} />
          <TextField control={form.control} name="fullName" label="Овог нэр" autoComplete="off" />
          <TextField
            control={form.control}
            name="phone"
            label="Утас"
            type="tel"
            inputMode="numeric"
            placeholder="99112233"
            description="8 оронтой дугаар"
          />

          <Controller
            control={form.control}
            name="gender"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Хүйс</FieldLabel>
                <RadioGroup
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  className="grid grid-cols-2 gap-2"
                  aria-invalid={fieldState.invalid}
                >
                  {(Object.keys(GENDER_LABELS) as Array<keyof typeof GENDER_LABELS>).map((g) => (
                    <label
                      key={g}
                      className={cn(
                        "flex h-10 cursor-pointer items-center gap-2.5 rounded-lg border bg-background px-3 text-base",
                        field.value === g && "border-primary bg-accent",
                      )}
                    >
                      <RadioGroupItem value={g} aria-label={GENDER_LABELS[g]} />
                      {GENDER_LABELS[g]}
                    </label>
                  ))}
                </RadioGroup>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <TextField
            control={form.control}
            name="birthYear"
            label="Төрсөн он"
            inputMode="numeric"
            maxLength={4}
            placeholder="1995"
          />

          <Controller
            control={form.control}
            name="assignedTrainerId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="assignedTrainerId">
                  Хариуцсан багш <span className="font-normal text-muted-foreground">(заавал биш)</span>
                </FieldLabel>
                <Select value={field.value ?? "none"} onValueChange={field.onChange} disabled={disabled}>
                  <SelectTrigger id="assignedTrainerId" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Сонгоогүй</SelectItem>
                    {trainers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.full_name}
                        {!t.is_active && " (идэвхгүй)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <TextareaField
            control={form.control}
            name="notes"
            label="Тэмдэглэл"
            optional
            rows={3}
            placeholder="Жишээ: эрүүл мэндийн онцлог, зорилго"
          />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Буцах
            </Button>
            <SubmitButton pending={pending} disabled={disabled}>
              {clientId ? "Хадгалах" : "Үйлчлүүлэгч нэмэх"}
            </SubmitButton>
          </div>
        </FieldGroup>
      </fieldset>
    </form>
  );
}
