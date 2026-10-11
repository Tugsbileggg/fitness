import { ArrowLeftIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { StatusScreen } from "@/components/status-screen";
import { Button } from "@/components/ui/button";

/** Апп доторх 404 (жишээ нь устгагдсан үйлчлүүлэгч). Хажуугийн цэс хэвээр үлдэнэ. */
export default function AppNotFound() {
  return (
    <StatusScreen
      code="404"
      title="Олдсонгүй"
      description="Энэ бичлэг устсан эсвэл танай фитнест хамаарахгүй байна."
      actions={
        <>
          <Button asChild>
            <Link href="/dashboard">
              <ArrowLeftIcon />
              Хяналт руу буцах
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/clients">
              <UsersIcon />
              Үйлчлүүлэгчид
            </Link>
          </Button>
        </>
      }
    />
  );
}
