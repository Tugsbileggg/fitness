"use client";

import { Undo2Icon } from "lucide-react";
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
import { formatMNT } from "@/lib/money";
import { voidPayment } from "../actions";

export function VoidPaymentDialog({
  paymentId,
  clientId,
  amount,
}: {
  paymentId: string;
  clientId: string;
  amount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await voidPayment(paymentId, clientId, { reason });
      if (!result.ok) {
        setError(result.fieldErrors?.reason ?? result.error);
        return;
      }
      toast.success(result.message ?? "Хүчингүй боллоо");
      setOpen(false);
      setReason("");
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive">
          <Undo2Icon />
          Хүчингүй болгох
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{formatMNT(amount)} төлбөрийг хүчингүй болгох уу?</DialogTitle>
            <DialogDescription>
              Төлбөр түүхэнд &quot;хүчингүй&quot; тэмдэгтэй үлдэнэ. Орлогоос хасагдаж, эрхийн хугацаа өмнөх
              төлбөрийнх рүү буцна.
            </DialogDescription>
          </DialogHeader>
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="void-reason">Шалтгаан</FieldLabel>
            <Textarea
              id="void-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Жишээ: буруу багц сонгосон"
              rows={2}
            />
            <FieldError>{error}</FieldError>
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Болих
            </Button>
            <SubmitButton pending={pending} variant="destructive">
              Хүчингүй болгох
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
