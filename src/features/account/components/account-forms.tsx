"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { applyFieldErrors, FormError, PasswordField, SubmitButton, TextField } from "@/components/form/fields";
import { FieldGroup } from "@/components/ui/field";
import { changePassword, updateProfile } from "../actions";
import {
  changePasswordSchema,
  profileSchema,
  type ChangePasswordInput,
  type ProfileInput,
  type ProfileValues,
} from "../schemas";

export function ProfileForm({ defaultValues }: { defaultValues: ProfileInput }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ProfileInput, unknown, ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues });

  const onSubmit = form.handleSubmit(() => {
    const values = form.getValues();
    setError(null);
    startTransition(async () => {
      const result = await updateProfile(values);
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
      <FieldGroup>
        <FormError message={error} />
        <TextField control={form.control} name="fullName" label="Овог нэр" autoComplete="name" />
        <TextField
          control={form.control}
          name="phone"
          label="Утас"
          optional
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
        />
        <div className="flex justify-end">
          <SubmitButton pending={pending}>Хадгалах</SubmitButton>
        </div>
      </FieldGroup>
    </form>
  );
}

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", password: "", passwordConfirm: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const result = await changePassword(values);
      if (!result.ok) {
        setError(result.error);
        applyFieldErrors(form, result.fieldErrors);
        return;
      }
      toast.success(result.message ?? "Солигдлоо");
      form.reset();
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormError message={error} />
        <PasswordField control={form.control} name="currentPassword" label="Одоогийн нууц үг" />
        <PasswordField
          control={form.control}
          name="password"
          label="Шинэ нууц үг"
          autoComplete="new-password"
          description="Хамгийн багадаа 8 тэмдэгт"
        />
        <PasswordField control={form.control} name="passwordConfirm" label="Шинэ нууц үг давтах" autoComplete="new-password" />
        <div className="flex justify-end">
          <SubmitButton pending={pending}>Нууц үг солих</SubmitButton>
        </div>
      </FieldGroup>
    </form>
  );
}
