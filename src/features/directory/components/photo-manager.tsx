"use client";

import { ArrowUpToLineIcon, ImagePlusIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { gymPhotoUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { resizeImage } from "../browser";
import { MAX_PHOTOS } from "../schemas";

/**
 * Зургууд шууд хөтчөөс Storage руу (RLS: менежер зөвхөн өөрийн фитнесийн хавтаст) байршина.
 * Маягтыг хадгалах үед л танилцуулгад холбогдоно. Эхний зураг нь нүүр зураг.
 */
export function PhotoManager({
  gymId,
  value,
  onChange,
  disabled,
}: {
  gymId: string;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const remaining = MAX_PHOTOS - value.length;

  const upload = async (files: File[]) => {
    const selected = files.slice(0, remaining);
    if (files.length > remaining) toast.warning(`${MAX_PHOTOS} хүртэл зураг оруулна. Эхний ${selected.length}-ийг авлаа.`);
    setUploading(selected.length);
    const supabase = createClient();
    const added: string[] = [];
    for (const [i, file] of selected.entries()) {
      try {
        if (!file.type.startsWith("image/")) throw new Error("Зөвхөн зураг оруулна.");
        const blob = await resizeImage(file);
        const path = `${gymId}/photo-${Date.now()}${i}.jpg`;
        const { error } = await supabase.storage
          .from("gym-photos")
          .upload(path, blob, { contentType: "image/jpeg", upsert: false });
        if (error) throw new Error("Зураг байршуулахад алдаа гарлаа. Дахин оролдоно уу.");
        added.push(path);
      } catch (e) {
        toast.error(`${file.name}: ${e instanceof Error ? e.message : "алдаа гарлаа"}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (added.length) {
      onChange([...value, ...added]);
      toast.success(`${added.length} зураг нэмэгдлээ. "Хадгалах" дарахад нийтэд харагдана.`);
    }
  };

  const busy = uploading > 0;

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {value.map((path, i) => (
            <li key={path} className="group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- Storage-ийн жижиг урьдчилсан харагдац */}
              <img src={gymPhotoUrl(path) ?? ""} alt={`Зураг ${i + 1}`} className="size-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  Нүүр зураг
                </span>
              )}
              <div className="absolute inset-x-1.5 bottom-1.5 flex justify-end gap-1">
                {i > 0 && (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="secondary"
                    className="shadow"
                    disabled={disabled}
                    onClick={() => onChange([path, ...value.filter((p) => p !== path)])}
                    aria-label={`Зураг ${i + 1}-ийг нүүр зураг болгох`}
                    title="Нүүр зураг болгох"
                  >
                    <ArrowUpToLineIcon />
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon-sm"
                  variant="secondary"
                  className="text-destructive shadow"
                  disabled={disabled}
                  onClick={() => onChange(value.filter((p) => p !== path))}
                  aria-label={`Зураг ${i + 1}-ийг хасах`}
                  title="Хасах"
                >
                  <Trash2Icon />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) void upload(files);
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={disabled || busy || remaining <= 0}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2Icon className="animate-spin" /> : <ImagePlusIcon />}
          {busy ? `Байршуулж байна (${uploading})…` : "Зураг нэмэх"}
        </Button>
        <span className="text-sm text-muted-foreground">
          {value.length}/{MAX_PHOTOS}. Заал, тоног төхөөрөмж, хаалганы гадна талын зураг тохиромжтой.
        </span>
      </div>
    </div>
  );
}
