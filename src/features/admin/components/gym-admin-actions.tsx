"use client";

import { BadgeCheckIcon, BadgeXIcon, CalendarPlusIcon, PauseCircleIcon, PlayCircleIcon, Undo2Icon } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/dates";
import type { ActionResult } from "@/lib/validation";
import { extendTrial, setGymSuspended, setGymVerified, voidPlatformPayment } from "../actions";

function useRun() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<ActionResult<unknown>>, onDone?: () => void) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message ?? "Амжилттай");
        onDone?.();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  return { pending, run };
}

/** Шалтгаан/утга асуудаг жижиг цонх. */
function PromptDialog({
  trigger,
  title,
  description,
  label,
  placeholder,
  submitLabel,
  destructive,
  inputMode,
  initial = "",
  onSubmit,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  label: string;
  placeholder?: string;
  submitLabel: string;
  destructive?: boolean;
  inputMode?: "numeric";
  initial?: string;
  onSubmit: (value: string, close: () => void) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setValue(initial);
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!value.trim()) {
              setError(`${label} оруулна уу`);
              return;
            }
            onSubmit(value.trim(), () => setOpen(false));
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="prompt-value">{label}</FieldLabel>
            {inputMode === "numeric" ? (
              <Input
                id="prompt-value"
                inputMode="numeric"
                className="w-32"
                value={value}
                onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
              />
            ) : (
              <Textarea id="prompt-value" rows={2} value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} />
            )}
            <FieldError>{error}</FieldError>
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Болих
            </Button>
            <SubmitButton pending={false} variant={destructive ? "destructive" : "default"}>
              {submitLabel}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function GymAdminActions({
  gymId,
  verified,
  suspended,
  status,
}: {
  gymId: string;
  verified: boolean;
  suspended: boolean;
  status: string;
}) {
  const { pending, run } = useRun();

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" disabled={pending} onClick={() => run(() => setGymVerified(gymId, !verified))}>
        {verified ? <BadgeXIcon /> : <BadgeCheckIcon />}
        {verified ? "Баталгаажуулалт цуцлах" : "Баталгаажуулах"}
      </Button>

      {(status === "trial" || status === "past_due") && (
        <PromptDialog
          trigger={
            <Button variant="outline" disabled={pending}>
              <CalendarPlusIcon />
              Туршилт сунгах
            </Button>
          }
          title="Туршилтыг сунгах"
          description="Туршилтын хугацаа (дууссан бол өнөөдрөөс) энэ хэдэн хоногоор сунгагдана."
          label="Хоног"
          inputMode="numeric"
          initial="7"
          submitLabel="Сунгах"
          onSubmit={(value, close) =>
            run(async () => {
              const result = await extendTrial(gymId, Number(value));
              if (result.ok) result.message = `Туршилт ${formatDate(result.data.trialEndsAt)} хүртэл сунгагдлаа`;
              return result;
            }, close)
          }
        />
      )}

      {suspended ? (
        <Button variant="outline" disabled={pending} onClick={() => run(() => setGymSuspended(gymId, false))}>
          <PlayCircleIcon />
          Сэргээх
        </Button>
      ) : (
        <PromptDialog
          trigger={
            <Button variant="destructive" disabled={pending}>
              <PauseCircleIcon />
              Түр зогсоох
            </Button>
          }
          title="Фитнесийг түр зогсоох уу?"
          description="Фитнес зөвхөн харах горимд шилжинэ. Өгөгдөл устахгүй, дараа нь сэргээж болно."
          label="Шалтгаан"
          placeholder="Жишээ: 2 сар төлбөр хийгээгүй"
          submitLabel="Түр зогсоох"
          destructive
          onSubmit={(value, close) => run(() => setGymSuspended(gymId, true, value), close)}
        />
      )}
    </div>
  );
}

export function VoidPlatformPaymentButton({ paymentId, gymId }: { paymentId: string; gymId: string }) {
  const { pending, run } = useRun();
  return (
    <PromptDialog
      trigger={
        <Button variant="ghost" size="sm" className="text-destructive" disabled={pending}>
          <Undo2Icon />
          Хүчингүй болгох
        </Button>
      }
      title="Платформын төлбөрийг хүчингүй болгох уу?"
      description="Эрхийн хугацаа өмнөх төлбөрийнх рүү буцна. Төлбөр түүхэнд тэмдэглэгдэн үлдэнэ."
      label="Шалтгаан"
      submitLabel="Хүчингүй болгох"
      destructive
      onSubmit={(value, close) => run(() => voidPlatformPayment(paymentId, gymId, value), close)}
    />
  );
}
