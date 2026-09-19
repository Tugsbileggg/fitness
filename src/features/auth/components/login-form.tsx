"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  applyFieldErrors,
  FormError,
  PasswordField,
  SubmitButton,
  TextField,
} from "@/components/form/fields";
import { FieldGroup } from "@/components/ui/field";
import { signIn } from "../actions";
import { loginSchema, type LoginInput } from "../schemas";

export function LoginForm({ next }: { next: string | null }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const result = await signIn(values, next);
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
        <TextField
          control={form.control}
          name="email"
          label="Имэйл"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="name@example.com"
        />
        <PasswordField control={form.control} name="password" label="Нууц үг" />
        <div className="-mt-2 text-right">
          <Link
            href="/forgot-password"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Нууц үгээ мартсан уу?
          </Link>
        </div>
        <SubmitButton pending={pending} size="lg" className="w-full">
          Нэвтрэх
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
