import { Badge } from "@/components/ui/badge";
import type { TrainerAccountStatus } from "../queries";

export function TrainerAccountBadge({
  account,
  isActive,
}: {
  account: TrainerAccountStatus;
  isActive: boolean;
}) {
  if (!isActive) return <Badge variant="muted">Идэвхгүй</Badge>;
  switch (account.kind) {
    case "active":
      return <Badge variant="success">Нэвтэрдэг</Badge>;
    case "invited":
      return <Badge variant="info">Урилга илгээсэн</Badge>;
    default:
      return <Badge variant="outline">Нэвтрэх эрхгүй</Badge>;
  }
}
