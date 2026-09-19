"use client";

import { Loader2Icon, UploadIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { GymLogo } from "@/components/app-shell/gym-logo";
import { Button } from "@/components/ui/button";
import { LOGO_TYPES, validateLogo } from "@/features/auth/schemas";
import { createClient } from "@/lib/supabase/client";
import { setGymLogo } from "../actions";

/**
 * Лого шууд browser-оос Supabase Storage руу байршина (RLS: менежер зөвхөн өөрийн фитнесийн хавтаст).
 * Хуучин файлыг устгахгүй: шинэ файлд шинэ нэр өгч, gyms.logo_path-ийг солино.
 */
export function LogoUploader({
  gymId,
  gymName,
  logoUrl,
  disabled,
}: {
  gymId: string;
  gymName: string;
  logoUrl: string | null;
  disabled?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  const upload = (file: File) =>
    startTransition(async () => {
      const invalid = validateLogo(file);
      if (invalid) {
        toast.error(invalid);
        return;
      }
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${gymId}/logo-${Date.now()}.${ext}`;
      const { error } = await createClient()
        .storage.from("gym-logos")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) {
        toast.error("Лого байршуулахад алдаа гарлаа. Дахин оролдоно уу.");
        return;
      }
      const result = await setGymLogo(path);
      if (result.ok) {
        toast.success(result.message ?? "Лого шинэчлэгдлээ");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });

  const remove = () =>
    startTransition(async () => {
      const result = await setGymLogo(null);
      if (result.ok) {
        toast.success(result.message ?? "Хаслаа");
        router.refresh();
      } else toast.error(result.error);
    });

  return (
    <div className="flex flex-wrap items-center gap-4">
      <GymLogo name={gymName} logoUrl={logoUrl} className="size-16 text-2xl" />
      <input
        ref={inputRef}
        type="file"
        accept={LOGO_TYPES.join(",")}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) upload(file);
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={disabled || pending} onClick={() => inputRef.current?.click()}>
          {pending ? <Loader2Icon className="animate-spin" /> : <UploadIcon />}
          {logoUrl ? "Лого солих" : "Лого оруулах"}
        </Button>
        {logoUrl && (
          <Button variant="ghost" disabled={disabled || pending} onClick={remove}>
            <XIcon />
            Хасах
          </Button>
        )}
      </div>
      <p className="w-full text-sm text-muted-foreground">PNG, JPG эсвэл WEBP, 2MB хүртэл.</p>
    </div>
  );
}
