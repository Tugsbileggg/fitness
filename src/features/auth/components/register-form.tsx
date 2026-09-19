"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, XIcon } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  applyFieldErrors,
  FormError,
  PasswordField,
  SubmitButton,
  TextField,
} from "@/components/form/fields";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { registerGym } from "../actions";
import { LOGO_TYPES, registerSchema, validateLogo, type RegisterInput } from "../schemas";

export function RegisterForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      gymName: "",
      gymAddress: "",
      gymPhone: "",
      managerName: "",
      email: "",
      password: "",
      passwordConfirm: "",
    },
  });

  function onLogoChange(file: File | null) {
    const message = validateLogo(file);
    setLogoError(message);
    if (preview) URL.revokeObjectURL(preview);
    if (!file || message) {
      setLogo(null);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setLogo(file);
    setPreview(URL.createObjectURL(file));
  }

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) formData.set(key, value ?? "");
    if (logo) formData.set("logo", logo);

    startTransition(async () => {
      const result = await registerGym(formData);
      if (result && !result.ok) {
        setError(result.error);
        applyFieldErrors(form, result.fieldErrors);
        if (result.fieldErrors?.logo) setLogoError(result.fieldErrors.logo);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormError message={error} />

        <FieldSet>
          <FieldLegend>Фитнесийн мэдээлэл</FieldLegend>
          <FieldGroup>
            <TextField control={form.control} name="gymName" label="Фитнесийн нэр" autoComplete="organization" />
            <TextField
              control={form.control}
              name="gymAddress"
              label="Хаяг"
              placeholder="Жишээ: БЗД, 26-р хороо, Их Монгол улс гудамж 12"
              autoComplete="street-address"
            />
            <TextField
              control={form.control}
              name="gymPhone"
              label="Утас"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="99112233"
              description="8 оронтой дугаар"
            />

            <Field data-invalid={Boolean(logoError)}>
              <FieldLabel htmlFor="logo">
                Лого <span className="font-normal text-muted-foreground">(заавал биш)</span>
              </FieldLabel>
              <div className="flex items-center gap-3">
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element -- локал blob урьдчилсан харагдац
                    <img src={preview} alt="Логоны урьдчилсан харагдац" className="size-full object-cover" />
                  ) : (
                    <ImageIcon className="size-6 text-muted-foreground" />
                  )}
                </div>
                <input
                  ref={fileRef}
                  id="logo"
                  type="file"
                  accept={LOGO_TYPES.join(",")}
                  className="sr-only"
                  onChange={(e) => onLogoChange(e.target.files?.[0] ?? null)}
                />
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                  {logo ? "Солих" : "Зураг сонгох"}
                </Button>
                {logo && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Логог хасах"
                    onClick={() => onLogoChange(null)}
                  >
                    <XIcon />
                  </Button>
                )}
              </div>
              {!logoError && <FieldDescription>PNG, JPG эсвэл WEBP, 2MB хүртэл</FieldDescription>}
              <FieldError>{logoError}</FieldError>
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Менежерийн мэдээлэл</FieldLegend>
          <FieldGroup>
            <TextField control={form.control} name="managerName" label="Овог нэр" autoComplete="name" />
            <TextField
              control={form.control}
              name="email"
              label="Имэйл"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="name@example.com"
              description="Нэвтрэхэд ашиглана. Баталгаажуулах холбоос энэ хаяг руу очно."
            />
            <PasswordField
              control={form.control}
              name="password"
              label="Нууц үг"
              autoComplete="new-password"
              description="Хамгийн багадаа 8 тэмдэгт"
            />
            <PasswordField
              control={form.control}
              name="passwordConfirm"
              label="Нууц үг давтах"
              autoComplete="new-password"
            />
          </FieldGroup>
        </FieldSet>

        <SubmitButton pending={pending} size="lg" className="w-full">
          Бүртгүүлэх
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
