import { SearchXIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function GymNotFound() {
  return (
    <EmptyState
      icon={SearchXIcon}
      title="Фитнес олдсонгүй"
      description="Энэ хаягаар фитнес байхгүй эсвэл танилцуулгаа түр нуусан байна."
      action={
        <Button asChild>
          <Link href="/gyms">Бүх фитнесийг харах</Link>
        </Button>
      }
    />
  );
}
