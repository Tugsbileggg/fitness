"use client";

import { Trash2Icon } from "lucide-react";
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
import { deleteClientRecord } from "../actions";

export function DeleteClientButton({
  clientId,
  clientName,
  disabled,
}: {
  clientId: string;
  clientName: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onConfirm = () =>
    startTransition(async () => {
      const result = await deleteClientRecord(clientId);
      if (result.ok) {
        toast.success(result.message ?? "Устгалаа");
        router.push("/clients");
      } else {
        toast.error(result.error);
      }
    });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={disabled || pending}>
          <Trash2Icon />
          Устгах
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{clientName}-г устгах уу?</AlertDialogTitle>
          <AlertDialogDescription>
            Үйлчлүүлэгч жагсаалтаас хасагдана. Төлбөрийн түүх, орлогын тайланд хадгалагдсан хэвээр үлдэнэ.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Болих</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Устгах
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
