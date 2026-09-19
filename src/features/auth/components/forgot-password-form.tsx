"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { applyFieldErrors, FormError, SubmitButton, TextField } from "@/components/form/fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup } from "@/components/ui/field";
import { requestPasswordReset } from "../actions";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../schemas";

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const result = await requestPasswordReset(values);
      if (result.ok) {
        setSent(result.message ?? "Илгээлээ");
      } else {
        setError(result.error);
        applyFieldErrors(form, result.fieldErrors);
      }
    });
  });

  if (sent) {
    return (
      <Alert variant="success">
        <AlertDescription>{sent}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormError message={error} />
        <TextField
          control={form.control}
          name="email"
          label="Имэйл"
          type="email"
          inputMode="email"
          autoComplete="email"
        />
        <SubmitButton pending={pending} size="lg" className="w-full">
          Холбоос илгээх
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
