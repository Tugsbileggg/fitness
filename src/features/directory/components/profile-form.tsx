"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { applyFieldErrors, FormError, SubmitButton, TextareaField, TextField } from "@/components/form/fields";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { publicEnv } from "@/lib/env";
import { formatMNT } from "@/lib/money";
import { saveGymProfile } from "../actions";
import { AREA_GROUPS, AREAS } from "../areas";
import { type GymProfileInput, type GymProfileValues, gymProfileSchema } from "../schemas";
import type { PublicGymPlan } from "../types";
import { AmenitiesPicker } from "./amenities-picker";
import { HoursEditor } from "./hours-editor";
import { LocationPicker } from "./location-picker";
import { PhotoManager } from "./photo-manager";

export function GymProfileForm({
  gymId,
  defaultValues,
  address,
  plans,
  disabled,
}: {
  gymId: string;
  defaultValues: GymProfileInput;
  address: string;
  plans: PublicGymPlan[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<GymProfileInput, unknown, GymProfileValues>({
    resolver: zodResolver(gymProfileSchema),
    defaultValues,
  });
  const { control, formState } = form;
  const slug = useWatch({ control, name: "slug" });
  const siteHost = publicEnv.siteUrl.replace(/^https?:\/\//, "");

  const onSubmit = form.handleSubmit(
    () => {
      const values = form.getValues();
      setError(null);
      startTransition(async () => {
        const result = await saveGymProfile(values);
        if (!result.ok) {
          setError(result.error);
          applyFieldErrors(form, result.fieldErrors);
          return;
        }
        toast.success(result.message ?? "Хадгалагдлаа");
        form.reset(values);
        router.refresh();
      });
    },
    () => setError("Маягтын улаанаар тэмдэглэсэн хэсгийг засна уу"),
  );

  const off = disabled || pending;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormError message={error} />

      <Card>
        <CardHeader>
          <CardTitle>Нийтлэх</CardTitle>
          <CardDescription>Асаагаад хадгалахад “Фитнес хайх” хэсэгт гарна (админ баталгаажуулсны дараа).</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Controller
              control={control}
              name="isPublished"
              render={({ field }) => (
                <label className="flex min-h-11 items-center justify-between gap-4 rounded-lg border px-3 py-2">
                  <span>
                    <span className="block font-medium">Нийтэд харуулах</span>
                    <span className="block text-sm text-muted-foreground">
                      Унтраавал танилцуулга тань нуугдана, мэдээлэл устахгүй.
                    </span>
                  </span>
                  <Switch checked={field.value} onCheckedChange={field.onChange} disabled={off} />
                </label>
              )}
            />
            <TextField
              control={control}
              name="slug"
              label="Хуудасны хаяг"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              disabled={off}
              description={
                <>
                  {siteHost}/gyms/<span className="font-medium text-foreground">{slug || "…"}</span>. Латин жижиг
                  үсэг, тоо, зураас. Нийтэлсний дараа солибол өмнө хуваалцсан холбоос ажиллахаа болино.
                </>
              }
            />
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Танилцуулга</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <TextField
              control={control}
              name="tagline"
              label="Товч тайлбар"
              optional
              maxLength={120}
              placeholder="Жишээ нь: Хүчний болон кардио бэлтгэлийн орчин үеийн заал"
              disabled={off}
            />
            <TextareaField
              control={control}
              name="description"
              label="Дэлгэрэнгүй"
              optional
              rows={6}
              maxLength={2000}
              placeholder="Заал, тоног төхөөрөмж, багш нар, хичээлүүдийн тухай бичнэ үү."
              disabled={off}
            />
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Байршил</CardTitle>
          <CardDescription>
            Хаяг: {address}.{" "}
            <Link href="/settings" className="text-primary underline-offset-4 hover:underline">
              Тохиргооноос
            </Link>{" "}
            өөрчилнө.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Controller
              control={control}
              name="area"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="area">Дүүрэг, аймаг</FieldLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange} disabled={off}>
                    <SelectTrigger id="area" className="sm:w-72" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Сонгоно уу" />
                    </SelectTrigger>
                    <SelectContent>
                      {AREA_GROUPS.map((group) => (
                        <SelectGroup key={group.key}>
                          <SelectLabel>{group.label}</SelectLabel>
                          {AREAS.filter((a) => a.group === group.key).map((a) => (
                            <SelectItem key={a.code} value={a.code}>
                              {a.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={control}
              name="location"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="location">Газрын зураг дээрх байршил</FieldLabel>
                  <FieldDescription>
                    Газрын зураг дээр дарж эсвэл тэмдэглэгээг чирж фитнесийнхээ хаалгыг заана уу.
                  </FieldDescription>
                  <LocationPicker
                    id="location"
                    value={field.value}
                    onChange={field.onChange}
                    disabled={off}
                    invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Холбоо барих</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <TextField
              control={control}
              name="contactPhone"
              label="Нийтэд харагдах утас"
              optional
              type="tel"
              inputMode="numeric"
              className="sm:w-60"
              disabled={off}
              description="Үйлчлүүлэгчид “Залгах” товчоор энэ дугаар руу залгана."
            />
            <TextField
              control={control}
              name="facebookUrl"
              label="Facebook хуудас"
              optional
              placeholder="facebook.com/таны-хуудас"
              autoCapitalize="none"
              disabled={off}
            />
            <TextField
              control={control}
              name="instagramUrl"
              label="Instagram"
              optional
              placeholder="@таны_хаяг"
              autoCapitalize="none"
              disabled={off}
            />
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Цагийн хуваарь</CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="hours"
            render={({ field }) => (
              <HoursEditor
                value={field.value}
                onChange={field.onChange}
                disabled={off}
                errors={formState.errors.hours as never}
              />
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Үйлчилгээ</CardTitle>
          <CardDescription>Танай фитнест байгаа зүйлсийг сонгоно уу.</CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="amenities"
            render={({ field }) => <AmenitiesPicker value={field.value} onChange={field.onChange} disabled={off} />}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Зураг</CardTitle>
          <CardDescription>Эхний зураг жагсаалтад нүүр зураг болж харагдана.</CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="photoPaths"
            render={({ field, fieldState }) => (
              <>
                <PhotoManager gymId={gymId} value={field.value} onChange={field.onChange} disabled={off} />
                <FieldError errors={[fieldState.error]} />
              </>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Үнэ</CardTitle>
          <CardDescription>
            Эрхийн багцуудаас автоматаар харагдана.{" "}
            <Link href="/plans" className="text-primary underline-offset-4 hover:underline">
              Багцаа засах
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Controller
            control={control}
            name="showPrices"
            render={({ field }) => (
              <label className="flex min-h-11 items-center justify-between gap-4 rounded-lg border px-3 py-2">
                <span className="font-medium">Үнийг нийтэд харуулах</span>
                <Switch checked={field.value} onCheckedChange={field.onChange} disabled={off} />
              </label>
            )}
          />
          {plans.length > 0 ? (
            <ul className="divide-y rounded-lg border text-sm">
              {plans.map((plan, i) => (
                <li key={`${plan.name}-${i}`} className="flex justify-between gap-4 px-3 py-2">
                  <span>{plan.name}</span>
                  <span className="font-medium tabular-nums">{formatMNT(plan.price)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Идэвхтэй эрхийн багц алга.</p>
          )}
        </CardContent>
      </Card>

      <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 flex items-center justify-end gap-3 rounded-xl border bg-background/95 p-3 shadow-sm backdrop-blur lg:bottom-4">
        {formState.isDirty && <span className="text-sm text-muted-foreground">Хадгалаагүй өөрчлөлт байна</span>}
        <SubmitButton pending={pending} disabled={disabled}>
          Хадгалах
        </SubmitButton>
      </div>
    </form>
  );
}
