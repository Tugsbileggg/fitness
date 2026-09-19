"use client";

import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type BaseFieldProps<T extends FieldValues> = {
  // Гурав дахь параметр: zod transform-ийн дараах төрөл (маягт бүрт өөр).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<T, any, any>;
  name: FieldPath<T>;
  label: string;
  description?: ReactNode;
  optional?: boolean;
};

function Label({ htmlFor, label, optional }: { htmlFor: string; label: string; optional?: boolean }) {
  return (
    <FieldLabel htmlFor={htmlFor}>
      {label}
      {optional && <span className="font-normal text-muted-foreground">(заавал биш)</span>}
    </FieldLabel>
  );
}

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  optional,
  id,
  ...inputProps
}: BaseFieldProps<T> &
  Omit<ComponentProps<"input">, "name" | "value" | "defaultValue" | "onChange" | "onBlur">) {
  const inputId = id ?? String(name);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <Label htmlFor={inputId} label={label} optional={optional} />
          <Input
            id={inputId}
            aria-invalid={fieldState.invalid}
            {...inputProps}
            {...field}
            value={field.value ?? ""}
          />
          {description && !fieldState.error && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  optional,
  id,
  ...props
}: BaseFieldProps<T> &
  Omit<ComponentProps<"textarea">, "name" | "value" | "defaultValue" | "onChange" | "onBlur">) {
  const inputId = id ?? String(name);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <Label htmlFor={inputId} label={label} optional={optional} />
          <Textarea
            id={inputId}
            aria-invalid={fieldState.invalid}
            {...props}
            {...field}
            value={field.value ?? ""}
          />
          {description && !fieldState.error && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function PasswordField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  id,
  autoComplete = "current-password",
}: BaseFieldProps<T> & { id?: string; autoComplete?: string }) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? String(name);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <Label htmlFor={inputId} label={label} />
          <div className="relative">
            <Input
              id={inputId}
              type={visible ? "text" : "password"}
              autoComplete={autoComplete}
              aria-invalid={fieldState.invalid}
              className="pr-11"
              {...field}
              value={field.value ?? ""}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 right-0.5 -translate-y-1/2 text-muted-foreground"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "Нууц үгийг нуух" : "Нууц үгийг харуулах"}
            >
              {visible ? <EyeOffIcon /> : <EyeIcon />}
            </Button>
          </div>
          {description && !fieldState.error && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function SubmitButton({
  pending,
  children,
  ...props
}: { pending: boolean } & ComponentProps<typeof Button>) {
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending && <Loader2Icon className="animate-spin" />}
      {children}
    </Button>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <Alert variant="danger">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

/** Server Action-оос ирсэн талбарын алдаануудыг react-hook-form-д тусгана. */
export function applyFieldErrors<T extends FieldValues>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<T, any, any>,
  fieldErrors: Record<string, string> | undefined,
) {
  if (!fieldErrors) return;
  for (const [key, message] of Object.entries(fieldErrors)) {
    if (key === "_form") continue;
    form.setError(key as FieldPath<T>, { type: "server", message });
  }
}
