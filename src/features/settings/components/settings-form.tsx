"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { applyFieldErrors, FormError, SubmitButton, TextField } from "@/components/form/fields";
import { FieldGroup } from "@/components/ui/field";
import { updateGymSettings } from "../actions";
import { gymSettingsSchema, type GymSettingsInput, type GymSettingsValues } from "../schemas";

export function SettingsForm({ defaultValues, disabled }: { defaultValues: GymSettingsInput; disabled?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<GymSettingsInput, unknown, GymSettingsValues>({
    resolver: zodResolver(gymSettingsSchema),
    defaultValues,
  });

  const onSubmit = form.handleSubmit(() => {
    const values = form.getValues();
    setError(null);
    startTransition(async () => {
      const result = await updateGymSettings(values);
      if (!result.ok) {
        setError(result.error);
        applyFieldErrors(form, result.fieldErrors);
        return;
      }
      toast.success(result.message ?? "Хадгаллаа");
      form.reset(values);
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <fieldset disabled={disabled || pending} className="contents">
        <FieldGroup>
          <FormError message={error} />
          <TextField control={form.control} name="name" label="Фитнесийн нэр" />
          <TextField control={form.control} name="address" label="Хаяг" />
          <TextField control={form.control} name="phone" label="Утас" type="tel" inputMode="numeric" />
          <TextField
            control={form.control}
            name="expiringThresholdDays"
            label="&quot;Дуусах гэж буй&quot; гэж тооцох хоног"
            inputMode="numeric"
            maxLength={2}
            className="sm:w-32"
            description="Эрх дуусахад энэ хэдэн хоног үлдсэн үйлчлүүлэгчид хяналтын самбарт шараар гарна. Анхдагч: 7."
          />
          <div className="flex justify-end">
            <SubmitButton pending={pending} disabled={disabled}>
              Хадгалах
            </SubmitButton>
          </div>
        </FieldGroup>
      </fieldset>
    </form>
  );
}
