"use client";

import { BellRingIcon, CheckCircle2Icon, Undo2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/form/fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/dates";
import { markNotified, undoNotice } from "../actions";

export function NoticeControls({
  clientId,
  clientName,
  endsOn,
  notice,
  disabled,
}: {
  clientId: string;
  clientName: string;
  endsOn: string;
  notice: { id: string; notifiedAt: string; note: string | null; by: string | null } | null;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (notice) {
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md bg-emerald-50 px-2.5 py-1.5 text-sm text-emerald-900">
        <CheckCircle2Icon className="size-4 shrink-0 text-emerald-700" />
        <span>
          Мэдэгдсэн · {formatDateTime(notice.notifiedAt)}
          {notice.by && ` · ${notice.by}`}
          {notice.note && <span className="text-emerald-800"> — {notice.note}</span>}
        </span>
        {!disabled && (
          <Button
            variant="ghost"
            size="xs"
            className="ml-auto text-emerald-900"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await undoNotice(notice.id);
                if (result.ok) {
                  toast.success(result.message ?? "Буцаалаа");
                  router.refresh();
                } else toast.error(result.error);
              })
            }
          >
            <Undo2Icon />
            Буцаах
          </Button>
        )}
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await markNotified({ clientId, endsOn, note });
      if (!result.ok) {
        setError(result.fieldErrors?.note ?? result.error);
        return;
      }
      toast.success(result.message ?? "Тэмдэглэлээ");
      setOpen(false);
      setNote("");
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <BellRingIcon />
          Мэдэгдсэн
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{clientName}-д мэдэгдсэн үү?</DialogTitle>
            <DialogDescription>
              Эрх нь дуусч байгааг хэлсэн гэж өнөөдрийн огноогоор тэмдэглэнэ. Сунгамагц тэмдэглэл шинэчлэгдэнэ.
            </DialogDescription>
          </DialogHeader>
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor={`notice-${clientId}`}>
              Тэмдэглэл <span className="font-normal text-muted-foreground">(заавал биш)</span>
            </FieldLabel>
            <Textarea
              id={`notice-${clientId}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Жишээ: Утсаар хэлсэн, ирэх долоо хоногт сунгана"
              rows={2}
              maxLength={300}
            />
            <FieldError>{error}</FieldError>
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Болих
            </Button>
            <SubmitButton pending={pending}>Тэмдэглэх</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
