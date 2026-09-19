"use client";

import { MailIcon, UserCheckIcon, UserXIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/dates";
import { inviteTrainer, setTrainerActive } from "../actions";
import type { TrainerAccountStatus } from "../queries";
import { TrainerAccountBadge } from "./trainer-badges";

export function TrainerAccessCard({
  trainerId,
  email,
  isActive,
  account,
  disabled,
}: {
  trainerId: string;
  email: string | null;
  isActive: boolean;
  account: TrainerAccountStatus;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<{ ok: boolean; message?: string; error?: string }>) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message ?? "Амжилттай");
        router.refresh();
      } else {
        toast.error(result.error ?? "Алдаа гарлаа");
      }
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          Нэвтрэх эрх <TrainerAccountBadge account={account} isActive={isActive} />
        </CardTitle>
        <CardDescription>
          {account.kind === "none" &&
            "Багш системд нэвтэрч үйлчлүүлэгчдийг харах, нэмэх, төлбөр бүртгэх боломжтой болно. Орлогын тайлан харагдахгүй."}
          {account.kind === "invited" &&
            `Урилга ${formatDateTime(account.invitedAt)}-д илгээгдсэн. Багш имэйл дэх холбоосоор нууц үгээ тохируулна.`}
          {account.kind === "active" &&
            (account.lastSignInAt
              ? `Сүүлд ${formatDateTime(account.lastSignInAt)}-д нэвтэрсэн.`
              : "Багш нууц үгээ тохируулсан.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {isActive && account.kind !== "active" && (
          <Button
            onClick={() => run(() => inviteTrainer(trainerId))}
            disabled={pending || disabled || !email}
            title={!email ? "Эхлээд имэйл хаяг оруулна уу" : undefined}
          >
            <MailIcon />
            {account.kind === "invited" ? "Урилга дахин илгээх" : "Урилга илгээх"}
          </Button>
        )}
        {!email && isActive && account.kind === "none" && (
          <p className="text-sm text-muted-foreground sm:self-center">
            Урилга илгээхийн тулд доорх маягтад имэйл хаягийг оруулж хадгална уу.
          </p>
        )}

        {isActive ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={pending || disabled}>
                <UserXIcon />
                Идэвхгүй болгох
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Багшийг идэвхгүй болгох уу?</AlertDialogTitle>
                <AlertDialogDescription>
                  Багшийн мэдээлэл устахгүй, харин системд нэвтрэх эрх нь шууд хаагдана. Дараа нь дахин
                  идэвхжүүлж болно.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Болих</AlertDialogCancel>
                <AlertDialogAction onClick={() => run(() => setTrainerActive(trainerId, false))}>
                  Идэвхгүй болгох
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button
            variant="outline"
            onClick={() => run(() => setTrainerActive(trainerId, true))}
            disabled={pending || disabled}
          >
            <UserCheckIcon />
            Дахин идэвхжүүлэх
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
