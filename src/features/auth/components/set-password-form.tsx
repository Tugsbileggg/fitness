"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { applyFieldErrors, FormError, PasswordField, SubmitButton } from "@/components/form/fields";
import { FieldGroup } from "@/components/ui/field";
import { updatePassword } from "../actions";
import { setPasswordSchema, type SetPasswordInput } from "../schemas";

export function SetPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<SetPasswordInput>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: "", passwordConfirm: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const result = await updatePassword(values);
      if (result && !result.ok) {
        setError(result.error);
        applyFieldErrors(form, result.fieldErrors);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormError message={error} />
        <PasswordField
          control={form.control}
          name="password"
          label="Шинэ нууц үг"
          autoComplete="new-password"
          description="Хамгийн багадаа 8 тэмдэгт"
        />
        <PasswordField
          control={form.control}
          name="passwordConfirm"
          label="Нууц үг давтах"
          autoComplete="new-password"
        />
        <SubmitButton pending={pending} size="lg" className="w-full">
          Хадгалах
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
