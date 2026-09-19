"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  applyFieldErrors,
  FormError,
  SubmitButton,
  TextareaField,
  TextField,
} from "@/components/form/fields";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { createTrainer, updateTrainer } from "../actions";
import { trainerSchema, type TrainerInput, type TrainerValues } from "../schemas";

export function TrainerForm({
  trainerId,
  defaultValues,
  disabled,
}: {
  trainerId?: string;
  defaultValues: TrainerInput;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<TrainerInput, unknown, TrainerValues>({ resolver: zodResolver(trainerSchema), defaultValues });

  // Client талд шалгасны дараа анхны (transform хийгээгүй) утгуудыг илгээнэ; server дахин шалгана.
  const onSubmit = form.handleSubmit(() => {
    const values = form.getValues();
    setError(null);
    startTransition(async () => {
      if (trainerId) {
        const result = await updateTrainer(trainerId, values);
        if (!result.ok) {
          setError(result.error);
          applyFieldErrors(form, result.fieldErrors);
          return;
        }
        toast.success(result.message ?? "Хадгаллаа");
        form.reset(values);
        router.refresh();
      } else {
        const result = await createTrainer(values);
        if (!result.ok) {
          setError(result.error);
          applyFieldErrors(form, result.fieldErrors);
          return;
        }
        toast.success(result.message ?? "Бүртгэгдлээ");
        router.push(`/trainers/${result.data.id}`);
      }
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
          />
          <TextField
            control={form.control}
            name="specialization"
            label="Мэргэшил"
            optional
            placeholder="Жишээ: Хүндийн өргөлт, йог, кроссфит"
          />
          <TextField
            control={form.control}
            name="email"
            label="Имэйл"
            optional
            type="email"
            inputMode="email"
            description="Багшид системд нэвтрэх урилга илгээхэд хэрэгтэй."
          />
          <TextareaField control={form.control} name="notes" label="Тэмдэглэл" optional rows={3} />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Буцах
            </Button>
            <SubmitButton pending={pending} disabled={disabled}>
              {trainerId ? "Хадгалах" : "Багш нэмэх"}
            </SubmitButton>
          </div>
        </FieldGroup>
      </fieldset>
    </form>
  );
}
